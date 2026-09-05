/**
 * OpenSky Network ADSB provider.
 *
 * Docs: https://openskynetwork.github.io/opensky-api/rest.html
 *
 * Queries `/states/all` with a bounding box derived from lat/lng/radius.
 * Supports two modes:
 *   - Anonymous (default): no credentials, rate-limited (400 credits/day,
 *     10s resolution). Good enough for a first cut.
 *   - OAuth2 client-credentials: when `clientId` + `clientSecret` are provided
 *     in config, a bearer token is fetched and auto-refreshed ~30s before its
 *     30-minute expiry. Higher limits (4000+/day, 5s resolution).
 *
 * The OpenSky `states` response is a 2D array; each row is a state vector with
 * a fixed column order (see STATE_* indices below). We map it to normalized
 * AdsbAircraft objects, converting the OpenSky `category` to the MAVLink
 * ADSB_EMITTER_TYPE_* values used by the map layer (category is offset by 1).
 *
 * Auth: Mohammad Hefny
 */

import {
    AdsbProvider,
    AdsbAircraft,
    radiusToBoundingBox,
} from './js_adsbProvider.js';

const OPENSKY_API = 'https://opensky-network.org/api/states/all';
const OPENSKY_TOKEN_URL =
    'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const TOKEN_REFRESH_MARGIN_S = 30;   // refresh this many seconds before expiry
// Default backoff when OpenSky returns 429 without a Retry-After header.
// OpenSky anonymous tier is credit-limited; once rate-limited, wait a full
// poll cycle before retrying rather than hammering the endpoint.
const DEFAULT_429_BACKOFF_MS = 60000;

// OpenSky does not send CORS headers for third-party origins, so direct browser
// fetch() is blocked. Route through the local proxy in server.js instead.
// These are relative URLs resolved against the page origin (e.g. https://localhost:3000).
const PROXY_API = '/opensky/api/states/all';
const PROXY_TOKEN = '/opensky/token';

// Column indices in each OpenSky state vector row.
const STATE_ICAO24 = 0;
const STATE_CALLSIGN = 1;
const STATE_ORIGIN_COUNTRY = 2;
const STATE_TIME_POSITION = 3;
const STATE_LAST_CONTACT = 4;
const STATE_LONGITUDE = 5;
const STATE_LATITUDE = 6;
const STATE_BARO_ALTITUDE = 7;
const STATE_ON_GROUND = 8;
const STATE_VELOCITY = 9;
const STATE_TRUE_TRACK = 10;
const STATE_VERTICAL_RATE = 11;
const STATE_GEO_ALTITUDE = 13;
const STATE_SQUAWK = 14;
const STATE_SPI = 15;
const STATE_POSITION_SOURCE = 16;
const STATE_CATEGORY = 17;

/**
 * Map an OpenSky aircraft `category` to a MAVLink ADSB_EMITTER_TYPE_* value.
 *
 * OpenSky categories (index 17) and MAVLink ADSB_EMITTER_TYPE enums are NOT
 * the same — they only overlap for categories 0-8. Categories 9+ have
 * different meanings and must be mapped explicitly.
 *
 * OpenSky category -> MAVLink emitter type:
 *   0  No info              -> NO_INFO (0)
 *   1  No category info     -> NO_INFO (0)
 *   2  Light                -> LIGHT (1)
 *   3  Small                -> SMALL (2)
 *   4  Large                -> LARGE (3)
 *   5  High Vortex Large    -> HIGH_VORTEX_LARGE (4)
 *   6  Heavy                -> HEAVY (5)
 *   7  High Performance     -> HIGHLY_MANUV (6)
 *   8  Rotorcraft           -> ROTOCRAFT (7)
 *   9  Glider/sailplane     -> GLIDER (9)
 *   10 Lighter-than-air     -> LIGHTER_AIR (10)
 *   11 Parachutist/Skydiver -> PARACHUTE (11)
 *   12 Ultralight/hang-glid -> ULTRA_LIGHT (12)
 *   13 Reserved             -> UNASSIGNED2 (13)
 *   14 UAV                  -> UAV (14)
 *   15 Space vehicle        -> SPACE (15)
 *   16 Surface Emergency    -> EMERGENCY_SURFACE (17)
 *   17 Surface Service      -> SERVICE_SURFACE (18)
 *   18 Point Obstacle       -> POINT_OBSTACLE (19)
 *   19 Cluster Obstacle     -> POINT_OBSTACLE (19)
 *   20 Line Obstacle        -> POINT_OBSTACLE (19)
 */
const OPENSKY_CATEGORY_MAP = [
    0,  // 0:  No info -> NO_INFO
    0,  // 1:  No category info -> NO_INFO
    1,  // 2:  Light -> LIGHT
    2,  // 3:  Small -> SMALL
    3,  // 4:  Large -> LARGE
    4,  // 5:  High Vortex Large -> HIGH_VORTEX_LARGE
    5,  // 6:  Heavy -> HEAVY
    6,  // 7:  High Performance -> HIGHLY_MANUV
    7,  // 8:  Rotorcraft -> ROTOCRAFT
    9,  // 9:  Glider -> GLIDER
    10, // 10: Lighter-than-air -> LIGHTER_AIR
    11, // 11: Parachutist -> PARACHUTE
    12, // 12: Ultralight -> ULTRA_LIGHT
    13, // 13: Reserved -> UNASSIGNED2
    14, // 14: UAV -> UAV
    15, // 15: Space -> SPACE
    17, // 16: Surface Emergency -> EMERGENCY_SURFACE
    18, // 17: Surface Service -> SERVICE_SURFACE
    19, // 18: Point Obstacle -> POINT_OBSTACLE
    19, // 19: Cluster Obstacle -> POINT_OBSTACLE
    19, // 20: Line Obstacle -> POINT_OBSTACLE
];

function openskyCategoryToEmitterType(category) {
    if (category == null) return 0;
    if (category < 0 || category >= OPENSKY_CATEGORY_MAP.length) return 0;
    return OPENSKY_CATEGORY_MAP[category];
}

export class OpenSkyProvider extends AdsbProvider {
    /**
     * @param {object} [config]
     * @param {string} [config.url]         override states endpoint (defaults to local proxy)
     * @param {string} [config.tokenUrl]    override token endpoint (defaults to local proxy)
     * @param {string} [config.clientId]    OAuth2 client id (direct mode only)
     * @param {string} [config.clientSecret] OAuth2 client secret (direct mode only)
     * @param {boolean} [config.useProxy]   use local proxy (default true in browser)
     * @param {boolean} [config.useAuth]    attempt OAuth2 token (default true if clientId or useProxy)
     */
    constructor(config = {}, options = {}) {
        super(config, options);
        const useProxy = config.useProxy !== false;
        this._url = config.url || (useProxy ? PROXY_API : OPENSKY_API);
        this._tokenUrl = config.tokenUrl || (useProxy ? PROXY_TOKEN : OPENSKY_TOKEN_URL);
        this._clientId = config.clientId || '';
        this._clientSecret = config.clientSecret || '';
        // Auth is enabled if explicitly requested, or if credentials are present,
        // or if using the proxy (the proxy injects credentials server-side).
        this._useAuth = config.useAuth !== undefined
            ? !!config.useAuth
            : (!!this._clientId || useProxy);

        // Token cache
        this._accessToken = null;
        this._tokenExpiresAt = 0;   // ms epoch
        this._tokenPromise = null;  // in-flight token request
    }

    get id() {
        return 'opensky';
    }

    /** True when OAuth2 auth is enabled (credentials present or proxy injects them). */
    get isAuthenticated() {
        return this._useAuth;
    }

    /**
     * Obtain a valid bearer token, fetching/refreshing as needed.
     * Returns '' in anonymous mode.
     */
    async _ensureToken() {
        if (!this.isAuthenticated) return '';
        const now = Date.now();
        if (this._accessToken && now < this._tokenExpiresAt - TOKEN_REFRESH_MARGIN_S * 1000) {
            return this._accessToken;
        }
        // Coalesce concurrent token requests.
        if (!this._tokenPromise) {
            this._tokenPromise = this._fetchToken()
                .catch((e) => {
                    this.lastError = e;
                    console.error('[opensky] token fetch failed:', e);
                    throw e;
                })
                .finally(() => {
                    this._tokenPromise = null;
                });
        }
        return this._tokenPromise;
    }

    async _fetchToken() {
        // When using the proxy, credentials are injected server-side — don't
        // send them from the browser. In direct mode, send them in the body.
        const params = { grant_type: 'client_credentials' };
        if (this._clientId) params.client_id = this._clientId;
        if (this._clientSecret) params.client_secret = this._clientSecret;
        const body = new URLSearchParams(params);
        const res = await fetch(this._tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        if (!res.ok) {
            throw new Error(`[opensky] token HTTP ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        if (!json || !json.access_token) {
            throw new Error('[opensky] token response missing access_token');
        }
        this._accessToken = json.access_token;
        const expiresInS = json.expires_in != null ? Number(json.expires_in) : 1800;
        this._tokenExpiresAt = Date.now() + expiresInS * 1000;
        return this._accessToken;
    }

    buildRequest(lat, lng, radiusKm) {
        const bb = radiusToBoundingBox(Number(lat), Number(lng), Number(radiusKm));
        const params = new URLSearchParams({
            lamin: bb.lamin.toFixed(6),
            lomin: bb.lomin.toFixed(6),
            lamax: bb.lamax.toFixed(6),
            lomax: bb.lomax.toFixed(6),
            extended: 1,  // Required to get aircraft category (index 17)
        });
        const url = `${this._url}?${params.toString()}`;
        return { url, init: { method: 'GET' } };
    }

    async fetch(lat, lng, radiusKm) {
        const { url, init } = this.buildRequest(lat, lng, radiusKm);
        const token = await this._ensureToken();
        const headers = { ...(init.headers || {}) };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, { ...init, headers, signal: controller.signal });
            // 429 Too Many Requests — enter backoff so the manager suspends
            // polling. Respect Retry-After (seconds) when present, otherwise
            // use the default backoff. The provider stays constructed; the
            // manager skips ticks until rateLimitedUntil elapses.
            if (res.status === 429) {
                const retryAfterS = Number(res.headers.get('Retry-After'));
                const backoffMs = (isFinite(retryAfterS) && retryAfterS > 0)
                    ? retryAfterS * 1000
                    : DEFAULT_429_BACKOFF_MS;
                this.rateLimitedUntil = Date.now() + backoffMs;
                throw new Error(`[opensky] HTTP 429 Too Many Requests (backoff ${Math.round(backoffMs / 1000)}s)`);
            }
            // 401 -> token expired mid-flight; refresh once and retry.
            if (res.status === 401 && this.isAuthenticated) {
                this._accessToken = null;
                this._tokenExpiresAt = 0;
                const fresh = await this._ensureToken();
                const retryRes = await fetch(url, {
                    ...init,
                    headers: { ...headers, Authorization: `Bearer ${fresh}` },
                    signal: controller.signal,
                });
                if (retryRes.status === 429) {
                    const retryAfterS = Number(retryRes.headers.get('Retry-After'));
                    const backoffMs = (isFinite(retryAfterS) && retryAfterS > 0)
                        ? retryAfterS * 1000
                        : DEFAULT_429_BACKOFF_MS;
                    this.rateLimitedUntil = Date.now() + backoffMs;
                    throw new Error(`[opensky] HTTP 429 Too Many Requests (backoff ${Math.round(backoffMs / 1000)}s)`);
                }
                if (!retryRes.ok) {
                    throw new Error(`[opensky] HTTP ${retryRes.status} ${retryRes.statusText}`);
                }
                const json = await retryRes.json();
                this.lastFetchAt = Date.now();
                this.rateLimitedUntil = 0;   // success — clear any backoff
                return this.parseResponse(json);
            }
            if (!res.ok) {
                throw new Error(`[opensky] HTTP ${res.status} ${res.statusText}`);
            }
            const json = await res.json();
            this.lastFetchAt = Date.now();
            this.rateLimitedUntil = 0;   // success — clear any backoff
            return this.parseResponse(json);
        } finally {
            clearTimeout(timer);
        }
    }

    parseResponse(json) {
        if (!json || !Array.isArray(json.states)) return [];
        const now = Date.now();
        const out = [];
        for (const row of json.states) {
            if (!Array.isArray(row)) continue;
            const icao = row[STATE_ICAO24];
            if (!icao) continue;

            const ac = new AdsbAircraft(icao.toString());
            ac.callsign = (row[STATE_CALLSIGN] || '').trim();
            ac.originCountry = row[STATE_ORIGIN_COUNTRY] || '';
            ac.latitude = row[STATE_LATITUDE] ?? null;
            ac.longitude = row[STATE_LONGITUDE] ?? null;
            ac.altitude = row[STATE_BARO_ALTITUDE] ?? 0;
            ac.geoAltitude = row[STATE_GEO_ALTITUDE] ?? null;
            ac.onGround = !!row[STATE_ON_GROUND];
            ac.velocity = row[STATE_VELOCITY] ?? 0;
            ac.heading = row[STATE_TRUE_TRACK] ?? 0;
            ac.verticalRate = row[STATE_VERTICAL_RATE] ?? 0;
            ac.squawk = row[STATE_SQUAWK] != null ? row[STATE_SQUAWK].toString() : '';
            ac.spi = !!row[STATE_SPI];
            ac.positionSource = row[STATE_POSITION_SOURCE] ?? null;
            ac.emitterType = openskyCategoryToEmitterType(row[STATE_CATEGORY]);

            const lastContactS = row[STATE_LAST_CONTACT];
            ac.lastContact = lastContactS != null ? lastContactS * 1000 : now;
            const timePositionS = row[STATE_TIME_POSITION];
            ac.lastPosition = timePositionS != null ? timePositionS * 1000 : null;

            out.push(ac);
        }
        return out;
    }
}

export default OpenSkyProvider;
