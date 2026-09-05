/**
 * ADSB manager (singleton).
 *
 * Owns the active ADSB provider and the polling loop, merges normalized
 * aircraft into the shared registry (js_adsbUnit) and dispatches the events
 * the map layer listens to (EE_adsbExchangeReady / EE_adsbExpiredUpdate /
 * EE_adsbCleared / EE_adsbError).
 *
 * Query-area strategy (in priority order):
 *   1. If online drone units exist, compute a bounding circle that encloses
 *      all of them plus a configurable margin (default 200 KM) and scan that.
 *      This is re-evaluated on every unit nav update so the area follows the
 *      swarm.
 *   2. Otherwise, if browser geolocation is available, scan a circle around
 *      the GCS position.
 *   3. Otherwise, don't scan (no query area).
 *
 * This is the single entry point used by the rest of the app; providers are
 * selected via CONST_ADSB_CONFIG.PROVIDER in js_siteConfig and can be swapped
 * without touching the consumers.
 *
 * Auth: Mohammad Hefny
 */

import { js_eventEmitter } from '../events/js_eventEmitter.js';
import { EVENTS as js_event } from '../events/js_eventList.js';
import { js_globals } from '../js_globals.js';
import { js_localStorage } from '../js_localStorage.js';
import { js_adsbUnit } from '../js_adsbUnit.js';
import * as js_siteConfig from '../js_siteConfig.js';
import { OpenSkyProvider } from './js_adsbProviderOpenSky.js';
import { AisStreamProvider } from './js_adsbProviderAisStream.js';

/**
 * ADSB is enabled only when the user's runtime preference (localStorage)
 * is enabled. The site feature flag CONST_FEATURE.DISABLE_ADSB is checked
 * inside fn_getADSBEnabled() — when the feature is disabled at the site
 * level, the getter always returns false.
 */
function isADSBEnabled() {
    return js_localStorage.fn_getADSBEnabled();
}

/**
 * AISStream (maritime AIS) is enabled only when the user's runtime preference
 * (localStorage) is enabled. The site feature flag
 * CONST_FEATURE.DISABLE_AISStream is checked inside fn_getAISStreamEnabled() —
 * when the feature is disabled at the site level, the getter always returns
 * false and the aisstream provider is not created. AIS data comes from the
 * DroneEngage server over WebSocket (not HTTP polling), and is maritime
 * (ships) — there is no fallback to the aircraft providers.
 */
function isAISStreamEnabled() {
    return js_localStorage.fn_getAISStreamEnabled();
}

// Defaults
const DEFAULT_RADIUS_KM = 850;            // ADSB scan radius (swarm margin & geolocation fallback)
const DEFAULT_UNIT_FOLLOW_RADIUS_KM = 200;
const SWARM_RECOMPUTE_MS = 8000;         // throttle swarm-area recompute
const DEFAULT_REFRESH_RATE_MS = 60000;   // default polling interval
// Area-change tolerance: the swarm enclosing circle is recomputed on every
// unit-nav update (throttled to SWARM_RECOMPUTE_MS). Tiny drone movements
// produce sub-meter drift in the centroid/bounding box. Without a tolerance,
// _setArea() sees every float difference as a "change", stops the loop and
// restarts it with an immediate fetch — effectively turning the 60s poll into
// an 8s poll and burning through OpenSky's rate-limit credits. Only restart
// the loop when the center moves more than this many km or the radius changes
// by more than AREA_CHANGE_RADIUS_PCT. Below-tolerance updates still update
// the stored area so the next scheduled tick uses the fresh coordinates.
const AREA_CHANGE_CENTER_TOLERANCE_KM = 2;
const AREA_CHANGE_RADIUS_PCT = 0.10;     // 10%
// Aircraft expiry default is 4x the refresh rate so a plane survives ~4
// consecutive missed polls. OpenSky intermittently drops aircraft from
// responses (coverage gaps, receiver aggregation), so the window must cover
// several polls — not just one. Computed dynamically from the resolved refresh
// rate; an explicit OBJECT_TIMEOUT_MS in config still takes priority.
const OBJECT_TIMEOUT_REFRESH_MULTIPLIER = 4;

class AdsbManager {
    constructor() {
        this._provider = null;
        this._timer = null;
        this._running = false;
        this._inflight = false;

        // Current query area (lat, lng, radiusKm).
        this._lat = null;
        this._lng = null;
        this._radius = 0;

        // Source of the current query area: 'swarm' | 'geolocation' | null
        this._areaSource = null;

        // Geolocation state: true once the browser reports a valid position.
        this._geolocationAvailable = false;

        // Per-unit recenter throttle.
        this._droneRefreshMs = SWARM_RECOMPUTE_MS;
        this._callsTimeTable = {};
        this._lastSwarmCompute = 0;

        // Object expiry: explicit config override, otherwise 4x the resolved
        // refresh rate so a plane survives ~4 consecutive missed polls.
        const refreshMs = AdsbManager._resolveRefreshRateMs();
        this._objectTimeoutMs =
            (js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.OBJECT_TIMEOUT_MS)
            || OBJECT_TIMEOUT_REFRESH_MULTIPLIER * refreshMs;
        // ADSB scan radius: default from config, overridable at runtime by the
        // user slider (see _effectiveGeolocationRadiusKm). Used for both the
        // drone (swarm) circle and the home/geolocation circle — same value.
        this._geolocationRadiusKm =
            (js_siteConfig.CONST_ADSB_CONFIG && js_siteConfig.CONST_ADSB_CONFIG.RADIUS_KM) || DEFAULT_RADIUS_KM;

        // Last fetch error state. When non-null, the map layer shows a red
        // ADSB error indicator (toggle buttons + query circle). Cleared on
        // the next successful fetch. Dispatched via EE_adsbError.
        this._lastError = null;

        // React to enable/disable preference.
        // Bind handlers so `this` is preserved (the event emitter calls
        // callback(listener, data) without a this-binding).
        this._boundOnPreferenceChanged = this._onPreferenceChanged.bind(this);
        this._boundOnUnitsChanged = this._onUnitsChanged.bind(this);
        this._boundOnUnitNavUpdated = this._onUnitNavUpdated.bind(this);
        js_eventEmitter.fn_subscribe(js_event.EE_onPreferenceChanged, this, this._boundOnPreferenceChanged);
        // Recompute swarm area when units are added/removed/updated.
        js_eventEmitter.fn_subscribe(js_event.EE_unitAdded, this, this._boundOnUnitsChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_unitUpdated, this, this._boundOnUnitsChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_unitNavUpdated, this, this._boundOnUnitNavUpdated);
    }

    /**
     * Resolve the polling interval from config (with default fallback).
     * Centralized so the constructor (object-timeout default) and
     * _ensureProvider (provider refreshRateMs) stay in sync.
     */
    static _resolveRefreshRateMs(cfg = js_siteConfig.CONST_ADSB_CONFIG) {
        return (cfg && cfg.REFRESH_RATE_MS) || DEFAULT_REFRESH_RATE_MS;
    }

    /** Lazily build the provider selected in config. */
    _ensureProvider() {
        if (this._provider) return this._provider;
        const cfg = js_siteConfig.CONST_ADSB_CONFIG || {};
        const refreshMs = AdsbManager._resolveRefreshRateMs(cfg);
        switch ((cfg.PROVIDER || 'opensky').toLowerCase()) {
            case 'aisstream':
                if (!isAISStreamEnabled()) {
                    // AIS disabled by site flag or user preference — do not
                    // create a provider. AIS is maritime data over the
                    // DroneEngage WebSocket; there is no meaningful fallback
                    // to the aircraft (opensky) providers.
                    return null;
                }
                this._provider = new AisStreamProvider(
                    { url: (cfg.AISSTREAM && cfg.AISSTREAM.URL) || '' },
                    { refreshRateMs: (cfg.AISSTREAM && cfg.AISSTREAM.REFRESH_RATE_MS) || refreshMs }
                );
                break;
            case 'opensky':
            default:
                this._provider = new OpenSkyProvider(
                    {
                        url: (cfg.OPENSKY && cfg.OPENSKY.URL) || '',
                        tokenUrl: (cfg.OPENSKY && cfg.OPENSKY.TOKEN_URL) || '',
                        // Credentials are NOT passed to the browser — the local
                        // proxy in server.js injects them server-side. useAuth is
                        // inferred from the presence of the OPENSKY config block.
                        useAuth: !!(cfg.OPENSKY && (cfg.OPENSKY.CLIENT_ID || cfg.OPENSKY.USE_AUTH)),
                    },
                    { refreshRateMs: refreshMs }
                );
                break;
        }
        return this._provider;
    }

    /** Rebuild the provider (e.g. after config changed at runtime). */
    fn_reloadProvider() {
        this._stop();
        this._provider = null;
        if (this.hasQueryArea()) {
            this._start();
        }
    }

    hasQueryArea() {
        return (this._lat !== null && this._lat !== undefined) && this._radius > 0;
    }

    /**
     * Whether the polling loop is currently running (ADSB enabled and an
     * area is known). The map layer uses this to decide whether to show
     * the query-area circle.
     */
    fn_isRunning() {
        return this._running;
    }

    /**
     * Last fetch error message, or null if the last fetch succeeded.
     * The map layer uses this to show/clear the red ADSB error indicator.
     * @returns {string|null}
     */
    fn_getLastError() {
        return this._lastError;
    }

    /**
     * Current query area, or null if none.
     * @returns {{lat:number, lng:number, radiusKm:number, source:string}|null}
     */
    fn_getQueryArea() {
        if (!this.hasQueryArea()) return null;
        return { lat: this._lat, lng: this._lng, radiusKm: this._radius, source: this._areaSource };
    }

    /**
     * Object expiry window in ms — markers older than this are hidden.
     * The map layer uses this so its hide logic matches the registry purge.
     */
    fn_getObjectTimeoutMs() {
        return this._objectTimeoutMs;
    }

    /**
     * Collect online drone units (non-GCS, defined, with a valid location).
     * @returns {Array} array of {lat, lng, unit} for units with valid GPS.
     */
    _collectOnlineDrones() {
        const list = js_globals.m_andruavUnitList;
        if (!list || typeof list.fn_getUnitValues !== 'function') return [];
        const units = list.fn_getUnitValues();
        if (!units) return [];
        const drones = [];
        for (const unit of units) {
            if (!unit || unit.m_IsGCS === true) continue;
            if (!unit.m_defined) continue;
            const loc = unit.m_Nav_Info && unit.m_Nav_Info.p_Location;
            if (!loc || loc.lat == null || loc.lng == null) continue;
            const lat = Number(loc.lat);
            const lng = Number(loc.lng);
            if (!isFinite(lat) || !isFinite(lng)) continue;
            drones.push({ lat, lng, unit });
        }
        return drones;
    }

    /**
     * Compute the centroid and radius of a circle that encloses all given
     * points plus a margin. Uses a simple bounding-box-center + max-distance
     * approach (good enough for ADSB area selection).
     * @param {Array<{lat:number, lng:number}>} points
     * @param {number} marginKm
     * @returns {{lat:number, lng:number, radiusKm:number} | null}
     */
    _computeEnclosingCircle(points, marginKm) {
        if (!points || points.length === 0) return null;
        if (points.length === 1) {
            return { lat: points[0].lat, lng: points[0].lng, radiusKm: marginKm };
        }
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const p of points) {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.lng < minLng) minLng = p.lng;
            if (p.lng > maxLng) maxLng = p.lng;
        }
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        // Find the farthest point from center, then add margin.
        let maxDistKm = 0;
        for (const p of points) {
            const d = haversineKm(centerLat, centerLng, p.lat, p.lng);
            if (d > maxDistKm) maxDistKm = d;
        }
        return { lat: centerLat, lng: centerLng, radiusKm: maxDistKm + marginKm };
    }

    /**
     * Effective geolocation fallback radius: runtime localStorage override
     * (user slider) takes priority, then config, then default.
     */
    _effectiveGeolocationRadiusKm() {
        const stored = js_localStorage.fn_getAdsbRadiusKm();
        if (stored !== null) return stored;
        return this._geolocationRadiusKm;
    }

    /**
     * Recompute the query area based on the current state:
     *   - if online drones exist -> enclosing circle + margin
     *   - else if geolocation available -> circle around GCS
     *   - else -> no area
     * Starts/stops polling as needed.
     */
    _recomputeArea() {
        if (!isADSBEnabled()) {
            this._stop();
            return;
        }

        const drones = this._collectOnlineDrones();
        if (drones.length > 0) {
            const circle = this._computeEnclosingCircle(drones, this._effectiveGeolocationRadiusKm());
            if (circle) {
                this._setArea(circle.lat, circle.lng, circle.radiusKm, 'swarm');
                return;
            }
        }

        // No drones — fall back to geolocation if available.
        if (this._geolocationAvailable && js_globals.myposition && js_globals.myposition.coords) {
            this._setArea(
                js_globals.myposition.coords.latitude,
                js_globals.myposition.coords.longitude,
                this._effectiveGeolocationRadiusKm(),
                'geolocation'
            );
            return;
        }

        // No area source available — stop polling.
        this._stop();
    }

    /**
     * Internal: set the query area and start/restart polling if it changed
     * meaningfully.
     *
     * The swarm enclosing circle is recomputed frequently (every
     * SWARM_RECOMPUTE_MS) as drones move, producing sub-meter float drift.
     * Restarting the loop on every such drift would trigger an immediate
     * fetch on each recompute — far faster than the configured poll interval
     * — and exhaust OpenSky's rate-limit credits. So we only restart when
     * the center moves beyond AREA_CHANGE_CENTER_TOLERANCE_KM or the radius
     * changes by more than AREA_CHANGE_RADIUS_PCT. Below-tolerance updates
     * still update the stored area; the next scheduled tick picks up the new
     * coordinates via provider.setQueryArea() in _tick().
     */
    _setArea(lat, lng, radiusKm, source) {
        const sourceChanged = this._areaSource !== source;
        const centerMovedKm = (this._lat == null || this._lng == null)
            ? Infinity
            : haversineKm(this._lat, this._lng, lat, lng);
        const radiusDelta = this._radius > 0
            ? Math.abs(radiusKm - this._radius) / this._radius
            : Infinity;
        const meaningfulChange = sourceChanged
            || centerMovedKm > AREA_CHANGE_CENTER_TOLERANCE_KM
            || radiusDelta > AREA_CHANGE_RADIUS_PCT;
        this._lat = lat;
        this._lng = lng;
        this._radius = radiusKm;
        this._areaSource = source;
        if (meaningfulChange) {
            // Area changed meaningfully — restart the loop so the next fetch
            // uses the new area immediately (and the provider's query area is
            // updated).
            if (this._running) {
                this._stop();
            }
            this._start();
        } else if (!this._running) {
            this._start();
        }
    }

    /**
     * Set / update the default query area from geolocation.
     * Only used as a fallback when no drones are online.
     * @param {number} lat
     * @param {number} lng
     * @param {number} radius  kilometers (ignored if drones are online — swarm area takes priority)
     */
    fn_changeDefaultLocation(lat, lng, radius) {
        this._geolocationAvailable = true;
        // Store geolocation as fallback; recompute picks swarm if drones exist.
        if (!isADSBEnabled()) return;
        const drones = this._collectOnlineDrones();
        if (drones.length > 0) {
            // Drones online — geolocation is just a fallback; recompute swarm area.
            this._recomputeArea();
        } else {
            this._setArea(lat, lng, radius || this._effectiveGeolocationRadiusKm(), 'geolocation');
        }
    }

    /**
     * Called by the settings UI when the user drags the ADSB radius slider.
     * Updates the geolocation fallback radius immediately and restarts the
     * polling loop so the next fetch uses the new radius. Also dispatches an
     * immediate event so the map circle updates without waiting for a poll.
     * @param {number} km
     */
    fn_setGeolocationRadiusKm(km) {
        if (!isADSBEnabled()) return;
        // If currently scanning based on geolocation, update radius in place
        // and restart the loop so the next fetch uses the new radius.
        if (this._areaSource === 'geolocation' && this.hasQueryArea()) {
            this._radius = km;
            if (this._running) {
                this._stop();
            }
            this._start();
        } else {
            // Swarm or no area — recompute (picks up new radius from localStorage
            // if it falls back to geolocation).
            this._recomputeArea();
        }
        // Dispatch immediately so the map circle updates without waiting for a poll.
        js_eventEmitter.fn_dispatch(js_event.EE_adsbExchangeReady, js_adsbUnit);
    }

    /**
     * Mark geolocation as unavailable (e.g. user denied permission).
     */
    fn_geolocationDenied() {
        this._geolocationAvailable = false;
        if (this._areaSource === 'geolocation') {
            // We were scanning based on geolocation — try swarm, else stop.
            this._recomputeArea();
        }
    }

    /**
     * Called on unit nav updates (drone position changes).
     * Throttled recompute of the swarm area.
     */
    fn_getADSBDataForUnit(p_andruavUnit) {
        if (!isADSBEnabled()) return;
        if (!p_andruavUnit || !p_andruavUnit.m_Nav_Info || !p_andruavUnit.m_Nav_Info.p_Location) return;

        const now = Date.now();
        const partyId = p_andruavUnit.getPartyID ? p_andruavUnit.getPartyID() : 'default';
        const last = this._callsTimeTable[partyId] || 0;
        if (now - last < this._droneRefreshMs) return;
        this._callsTimeTable[partyId] = now;

        // Recompute the swarm enclosing circle (covers all drones + margin).
        this._recomputeArea();
    }

    _onUnitsChanged() {
        if (!isADSBEnabled()) return;
        // Units added/removed — recompute area (may start or stop scanning).
        this._recomputeArea();
    }

    _onUnitNavUpdated() {
        // Throttled — actual recompute happens via fn_getADSBDataForUnit calls.
        // This is a lightweight fallback to ensure area updates even if
        // fn_getADSBDataForUnit is not called for a while.
        const now = Date.now();
        if (now - this._lastSwarmCompute < SWARM_RECOMPUTE_MS) return;
        this._lastSwarmCompute = now;
        if (!isADSBEnabled()) return;
        this._recomputeArea();
    }

    _start() {
        if (this._running) return;
        if (!this.hasQueryArea()) return;
        const provider = this._ensureProvider();
        if (!provider) return;   // e.g. aisstream selected but AIS disabled
        this._running = true;
        const me = this;
        // Run an immediate cycle, then poll — unless the provider is in
        // rate-limit backoff (e.g. a recent 429), in which case skip the
        // immediate fetch and let the interval pick up when backoff elapses.
        if (!provider.rateLimitedUntil || Date.now() >= provider.rateLimitedUntil) {
            this._tick().catch((e) => console.error('[adsb] tick error:', e));
        }
        this._timer = setInterval(() => {
            me._tick().catch((e) => console.error('[adsb] tick error:', e));
        }, provider.refreshRateMs);
    }

    _stop() {
        this._running = false;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    async _tick() {
        if (!this.hasQueryArea()) return;
        if (this._inflight) return;
        const provider = this._ensureProvider();
        if (!provider) return;   // no provider available (e.g. AIS disabled)
        // Respect provider rate-limit backoff (set when a 429 was received).
        // Skip this tick; the interval will fire again after refreshRateMs.
        console.log ('jh1');
        if (provider.rateLimitedUntil && Date.now() < provider.rateLimitedUntil) {
            console.log ('jh2');
            return;
        }
        provider.setQueryArea(this._lat, this._lng, this._radius);
        this._inflight = true;
        let aircraft = [];
        try {
            aircraft = await provider.fetch(this._lat, this._lng, this._radius);
        } catch (e) {
            console.error(`[adsb] ${provider.id} fetch failed:`, e);
            // Surface the error to the map layer so it can show a red ADSB
            // indicator (toggle buttons + query circle). Only dispatch when
            // the error message changes to avoid spamming on every tick.
            const msg = (e && e.message) ? e.message : String(e);
            if (this._lastError !== msg) {
                this._lastError = msg;
                js_eventEmitter.fn_dispatch(js_event.EE_adsbError, msg);
            }
            return;
        } finally {
            this._inflight = false;
        }

        // Clear any previous error state on success.
        if (this._lastError !== null) {
            this._lastError = null;
            js_eventEmitter.fn_dispatch(js_event.EE_adsbError, null);
        }

        // Merge into the shared registry.
        js_adsbUnit.fn_mergeNormalized(aircraft);

        // Notify the map layer that fresh data is available.
        js_eventEmitter.fn_dispatch(js_event.EE_adsbExchangeReady, js_adsbUnit);

        // Let the map hide stale markers before we purge them from the registry.
        js_eventEmitter.fn_dispatch(js_event.EE_adsbExpiredUpdate, this);
        const cutoff = Date.now() - this._objectTimeoutMs;
        js_adsbUnit.fn_purgeOlderThan(cutoff);
    }

    _onPreferenceChanged() {
        if (!isADSBEnabled()) {
            this._stop();
            // Clear any lingering error state so the red indicator doesn't
            // persist after ADSB is turned off.
            if (this._lastError !== null) {
                this._lastError = null;
                js_eventEmitter.fn_dispatch(js_event.EE_adsbError, null);
            }
            // Tell the map layer to drop every ADSB marker, hide the query
            // circle, and clear the registry — stale aircraft must not linger
            // after the polling loop stops.
            js_eventEmitter.fn_dispatch(js_event.EE_adsbCleared);
            js_eventEmitter.fn_dispatch(js_event.EE_adsbExchangeReady, js_adsbUnit);
        } else {
            // AIS preference may have changed — rebuild the provider so the
            // aisstream/opensky fallback is re-evaluated, then recompute.
            this.fn_reloadProvider();
            this._recomputeArea();
        }
    }
}

/**
 * Great-circle distance in km between two lat/lng points (Haversine).
 */
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const _instance = new AdsbManager();

/**
 * Start the manager once ADSB is enabled and an area is known. Called by the
 * app bootstrap after config/preferences are loaded.
 */
export function fn_initAdsb() {
    if (isADSBEnabled() && _instance.hasQueryArea()) {
        _instance._start();
    }
    return _instance;
}

export const js_adsbManager = _instance;
export default js_adsbManager;
