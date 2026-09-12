/**
 * Wind data provider for DroneEngage units.
 *
 * Fetches wind speed + direction from the Open-Meteo free forecast API
 * (https://open-meteo.com) — no API key, no signup, CORS-friendly, plain
 * HTTPS GET returning JSON. Wind is returned at fixed AGL levels
 * (10/80/120/180 m); fn_getWindForUnit picks the level closest to the
 * unit's current alt_relative (AGL).
 *
 * Caching: one fetch per rounded cell (lat/lng to CELL_ROUNDING decimals,
 * ~11 km at 0.1) per UTC hour. The free tier allows ~10k calls/day, so
 * this is plenty for a handful of drones moving slowly. A pending fetch
 * for a cell+hour is shared (de-duplicated) so concurrent callers don't
 * multiply requests.
 *
 * Auth: Mohammad Hefny
 */

import * as js_siteConfig from '../config/js_siteConfig.js';

/**
 * Open-Meteo fixed AGL levels (meters) and the API variable names for
 * speed + direction at each level. Ordered low→high.
 */
const WIND_LEVELS = [
    { alt: 10,  speedVar: 'wind_speed_10m',  dirVar: 'wind_direction_10m'  },
    { alt: 80,  speedVar: 'wind_speed_80m',  dirVar: 'wind_direction_80m'  },
    { alt: 120, speedVar: 'wind_speed_120m', dirVar: 'wind_direction_120m' },
    { alt: 180, speedVar: 'wind_speed_180m', dirVar: 'wind_direction_180m' },
];

/**
 * Pick the wind level closest to the given AGL altitude (meters).
 * @param {number} altAgl meters above ground
 * @returns {object} entry from WIND_LEVELS
 */
function fn_pickLevel(altAgl) {
    const alt = Math.max(0, Number(altAgl) || 0);
    let best = WIND_LEVELS[0];
    let bestDiff = Math.abs(alt - best.alt);
    for (let i = 1; i < WIND_LEVELS.length; i++) {
        const d = Math.abs(alt - WIND_LEVELS[i].alt);
        if (d < bestDiff) { best = WIND_LEVELS[i]; bestDiff = d; }
    }
    return best;
}

class CWindProvider {
    constructor() {
        // cache: key "lat,lng,hour" -> { ts, data: { level -> {speed, dir, gusts} } }
        this._cache = new Map();
        // pending fetches: key -> Promise (de-dupe concurrent callers)
        this._pending = new Map();
    }

    /**
     * Build the Open-Meteo URL for a given lat/lng requesting all four
     * wind levels + gusts for the current day.
     * @param {number} lat
     * @param {number} lng
     * @returns {string}
     */
    _buildUrl(lat, lng) {
        const vars = [];
        WIND_LEVELS.forEach(l => { vars.push(l.speedVar, l.dirVar); });
        vars.push('wind_gusts_10m');
        const hourly = vars.join(',');
        return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
               `&hourly=${hourly}&wind_speed_unit=ms&forecast_days=1&timezone=UTC`;
    }

    /**
     * Fetch + cache wind for the rounded cell covering (lat,lng) for the
     * current UTC hour. Returns a map: levelAlt -> { speedMs, directionDeg, gustsMs }.
     * @param {number} lat
     * @param {number} lng
     * @returns {Promise<Map<number, {speedMs:number,directionDeg:number,gustsMs:number}>|null>}
     */
    async _fetchCell(lat, lng) {
        const rounding = (js_siteConfig.CONST_WIND_CONFIG && js_siteConfig.CONST_WIND_CONFIG.CELL_ROUNDING) || 1;
        const rLat = Number(lat).toFixed(rounding);
        const rLng = Number(lng).toFixed(rounding);
        const now = new Date();
        const hourKey = now.getUTCFullYear() + '-' +
                        String(now.getUTCMonth() + 1).padStart(2, '0') + '-' +
                        String(now.getUTCDate()).padStart(2, '0') + 'T' +
                        String(now.getUTCHours()).padStart(2, '0');
        const key = `${rLat},${rLng},${hourKey}`;

        // Cache hit?
        const cached = this._cache.get(key);
        if (cached) return cached.data;

        // Pending fetch for the same cell+hour? Share it.
        if (this._pending.has(key)) return this._pending.get(key);

        const p = (async () => {
            try {
                const url = this._buildUrl(rLat, rLng);
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) return null;
                const json = await res.json();
                const hourly = json && json.hourly;
                if (!hourly || !Array.isArray(hourly.time)) return null;

                // Find the index of the current UTC hour in the time array.
                // Open-Meteo returns "YYYY-MM-DDTHH" in UTC when timezone=UTC.
                const idx = hourly.time.findIndex(t => t === hourKey || t.startsWith(hourKey));
                const i = idx >= 0 ? idx : 0;

                const result = new Map();
                WIND_LEVELS.forEach(l => {
                    const speedArr = hourly[l.speedVar];
                    const dirArr = hourly[l.dirVar];
                    const s = speedArr && Number.isFinite(speedArr[i]) ? speedArr[i] : null;
                    const d = dirArr && Number.isFinite(dirArr[i]) ? dirArr[i] : null;
                    if (s != null && d != null) {
                        result.set(l.alt, { speedMs: s, directionDeg: d, gustsMs: null });
                    }
                });
                // Attach gusts to every level (gusts only reported at 10m).
                const gustsArr = hourly['wind_gusts_10m'];
                const g = gustsArr && Number.isFinite(gustsArr[i]) ? gustsArr[i] : null;
                if (g != null) {
                    result.forEach(v => { v.gustsMs = g; });
                }

                this._cache.set(key, { ts: Date.now(), data: result });
                return result;
            } catch (err) {
                console.warn('[wind] fetch failed:', err);
                return null;
            } finally {
                this._pending.delete(key);
            }
        })();

        this._pending.set(key, p);
        return p;
    }

    /**
     * Get wind info for a DroneEngage unit, matched to its current AGL.
     * @param {object} unit a CAndruavUnit (uses m_Nav_Info.p_Location.lat/lng/alt_relative)
     * @returns {Promise<{speedMs:number, directionDeg:number, gustsMs:number|null, level:number}|null>}
     */
    async fn_getWindForUnit(unit) {
        if (!unit || !unit.m_Nav_Info || !unit.m_Nav_Info.p_Location) return null;
        const loc = unit.m_Nav_Info.p_Location;
        const lat = Number(loc.lat);
        const lng = Number(loc.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const altAgl = Number(loc.alt_relative) || 0;

        const cellData = await this._fetchCell(lat, lng);
        if (!cellData || cellData.size === 0) return null;

        const level = fn_pickLevel(altAgl);
        const entry = cellData.get(level.alt);
        if (!entry) {
            // Fall back to any available level.
            for (const [alt, v] of cellData) {
                return { ...v, level: alt };
            }
            return null;
        }
        return { ...entry, level: level.alt };
    }

    /**
     * Clear the cache (e.g. on provider reload / preference change).
     */
    fn_clearCache() {
        this._cache.clear();
        this._pending.clear();
    }
}

// Singleton export — mirrors the js_adsbManager pattern.
export const js_windProvider = new CWindProvider();
