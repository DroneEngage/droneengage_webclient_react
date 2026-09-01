/**
 * ADSB provider abstraction layer.
 *
 * Defines a normalized aircraft representation (AdsbAircraft) and an abstract
 * base class (AdsbProvider) that concrete providers (OpenSky, ADSB Exchange, ...)
 * extend. The rest of the application only talks to the manager + the normalized
 * shape, so swapping providers is a config change, not a code change.
 *
 * Auth: Mohammad Hefny
 */

import * as js_common from '../js_common.js';

/**
 * Normalized aircraft state.
 *
 * All units are SI (meters, m/s, degrees). `emitterType` uses the MAVLink
 * ADSB_EMITTER_TYPE_* values (see js_mavlink_v2.js) so the existing rendering
 * code in js_main.js works unchanged.
 */
export class AdsbAircraft {
    constructor(icao) {
        // Identity
        this.icao = icao;                 // ICAO 24-bit hex string (unique key)
        this.callsign = '';               // trimmed callsign or ''
        this.originCountry = '';          // country name (OpenSky) / '' otherwise
        this.registration = '';           // tail number if known
        this.modelDescription = '';       // aircraft model if known
        this.manufacturer = '';           // manufacturer if known

        // Position / motion (SI units)
        this.latitude = null;             // decimal degrees
        this.longitude = null;            // decimal degrees
        this.altitude = 0;                // barometric altitude in meters
        this.geoAltitude = null;          // geometric altitude in meters
        this.heading = 0;                 // true track / heading in degrees (0 = north)
        this.velocity = 0;                // ground speed in m/s
        this.verticalRate = 0;            // vertical rate in m/s (+ climb, - descend)
        this.onGround = false;            // surface report?

        // Transponder
        this.squawk = '';                 // squawk code or ''
        this.spi = false;                 // special purpose indicator

        // Classification (MAVLink ADSB_EMITTER_TYPE_*)
        this.emitterType = 0;             // see js_mavlink_v2.js

        // Bookkeeping
        this.lastContact = Date.now();    // ms epoch of last valid message
        this.lastPosition = null;         // ms epoch of last position report
        this.positionSource = null;       // 0=ADS-B,1=ASTERIX,2=MLAT,3=FLARM (OpenSky)

        // Render-side attachment (populated by the map layer, not the provider)
        this.p_marker = null;
    }
}

/**
 * Abstract base class for ADSB data providers.
 *
 * Concrete providers MUST implement:
 *   - buildRequest(lat, lng, radius)  -> { url, init } for fetch()
 *   - parseResponse(json)             -> AdsbAircraft[]
 *
 * The base class owns the polling loop and the fetch/error lifecycle.
 */
export class AdsbProvider {
    /**
     * @param {object} config  provider-specific config (credentials, urls, rates)
     * @param {object} options
     * @param {number} [options.refreshRateMs=10000]   polling interval
     * @param {number} [options.timeoutMs=15000]       per-request fetch timeout
     */
    constructor(config, options = {}) {
        this.config = config || {};
        this.refreshRateMs = options.refreshRateMs ?? 10000;
        this.timeoutMs = options.timeoutMs ?? 15000;

        // Current query area. Fetching only happens when a non-zero area is set.
        this._lat = null;
        this._lng = null;
        this._radius = 0;       // km

        this._timer = null;
        this._running = false;
        this._inflight = false;

        // Last fetch result, for diagnostics.
        this.lastError = null;
        this.lastFetchAt = 0;
    }

    /** Unique provider id, e.g. 'opensky' / 'adsbexchange'. */
    get id() {
        return 'base';
    }

    /**
     * Build the fetch request for a bounding area.
     * @returns {{url: string, init?: RequestInit}}
     */
    buildRequest(_lat, _lng, _radius) {
        throw new Error('AdsbProvider.buildRequest() must be implemented by subclass');
    }

    /**
     * Parse a raw provider response into an array of normalized AdsbAircraft.
     * @param {any} _json
     * @returns {AdsbAircraft[]}
     */
    parseResponse(_json) {
        throw new Error('AdsbProvider.parseResponse() must be implemented by subclass');
    }

    /** Set / update the area to query. radius is in kilometers. */
    setQueryArea(lat, lng, radius) {
        this._lat = lat;
        this._lng = lng;
        this._radius = radius;
    }

    hasQueryArea() {
        return (this._lat !== null && this._lat !== undefined) && this._radius > 0;
    }

    /** Start the polling loop. Safe to call multiple times. */
    start() {
        if (this._running) return;
        this._running = true;
        const me = this;
        this._timer = setInterval(() => {
            me._tick().catch((e) => {
                me.lastError = e;
                console.error(`[${me.id}] ADSB poll error:`, e);
            });
        }, this.refreshRateMs);
    }

    /** Stop the polling loop. */
    stop() {
        this._running = false;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    /**
     * Perform one fetch + parse. Returns AdsbAircraft[] or [] on error / no area.
     * Re-entrant safe: concurrent ticks are coalesced.
     */
    async _tick() {
        if (!this.hasQueryArea()) return [];
        if (this._inflight) return [];
        this._inflight = true;
        try {
            const aircraft = await this.fetch(this._lat, this._lng, this._radius);
            this.lastError = null;
            return aircraft;
        } catch (e) {
            this.lastError = e;
            throw e;
        } finally {
            this._inflight = false;
        }
    }

    /**
     * Fetch one snapshot for the given area and return normalized aircraft.
     * @param {number} lat
     * @param {number} lng
     * @param {number} radiusKm
     * @returns {Promise<AdsbAircraft[]>}
     */
    async fetch(lat, lng, radiusKm) {
        const { url, init } = this.buildRequest(lat, lng, radiusKm);
        js_common.fn_console_log(`[${this.id}] ADSB fetch: ${url}`);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, { ...init, signal: controller.signal });
            if (!res.ok) {
                throw new Error(`[${this.id}] HTTP ${res.status} ${res.statusText}`);
            }
            const json = await res.json();
            this.lastFetchAt = Date.now();
            return this.parseResponse(json);
        } finally {
            clearTimeout(timer);
        }
    }
}

/**
 * Convert a great-circle radius (km) into a lat/lng bounding box.
 * Useful for providers (OpenSky) that query by bounding box rather than radius.
 * @returns {{lamin:number, lomin:number, lamax:number, lomax:number}}
 */
export function radiusToBoundingBox(lat, lng, radiusKm) {
    lat = Number(lat);
    lng = Number(lng);
    radiusKm = Number(radiusKm);
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(radiusKm)) {
        // Fallback: return a zero-area box around (0,0) to avoid NaN in URLs.
        return { lamin: 0, lomin: 0, lamax: 0, lomax: 0 };
    }
    const latDegPerKm = 1 / 111.0;                 // ~111 km per degree of latitude
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const lngDegPerKm = 1 / (111.0 * (cosLat || 1));
    const dLat = radiusKm * latDegPerKm;
    const dLng = radiusKm * lngDegPerKm;
    return {
        lamin: lat - dLat,
        lamax: lat + dLat,
        lomin: lng - dLng,
        lomax: lng + dLng,
    };
}
