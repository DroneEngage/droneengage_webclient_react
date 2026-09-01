/**
 * ADSB Exchange provider (revamped).
 *
 * Previously this file used jQuery JSONP against the public
 * `public-api.adsbexchange.com/VirtualRadar` endpoint and had several bugs
 * (wrong `this` in the AJAX callback, a broken getInstance, methods called on
 * the wrong singleton). It has been rewritten as a concrete AdsbProvider that
 * uses the fetch API and emits normalized AdsbAircraft objects.
 *
 * NOTE: The old public VirtualRadar endpoint may be deprecated by ADSB Exchange.
 * It is kept here as a provider example; the active provider is selected via
 * config in js_adsbManager.
 *
 * Auth: Mohammad Hefny
 */

import {
    AdsbProvider,
    AdsbAircraft,
} from './adsb/js_adsbProvider.js';
import {
    CONST_FEET_TO_METER,
} from './js_helpers.js';

const KNOT_TO_MPS = 0.514444;          // knots -> m/s
const FPM_TO_MPS = CONST_FEET_TO_METER / 60; // feet/min -> m/s

export class AdsbExchangeProvider extends AdsbProvider {
    /**
     * @param {object} [config]
     * @param {string} [config.url]   base VirtualRadar URL
     */
    constructor(config = {}, options = {}) {
        super(config, options);
        this._url = config.url || 'https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json';
    }

    get id() {
        return 'adsbexchange';
    }

    buildRequest(lat, lng, radiusKm) {
        // VirtualRadar uses fDstL/fDstU in nautical miles (1 km ~= 0.539956 nm).
        const radiusNm = (radiusKm * 0.539956).toFixed(4);
        const url =
            `${this._url}?lat=${lat}&lng=${lng}&fDstL=0&fDstU=${radiusNm}`;
        return { url, init: { method: 'GET' } };
    }

    parseResponse(json) {
        if (!json || !Array.isArray(json.acList)) return [];
        const now = Date.now();
        const out = [];
        for (const raw of json.acList) {
            if (!raw) continue;
            const icao = raw.Icao || (raw.Id != null ? raw.Id.toString() : null);
            if (!icao) continue;

            const ac = new AdsbAircraft(icao.toString());
            ac.callsign = (raw.Call || '').trim();
            ac.modelDescription = raw.Mdl || '';
            ac.manufacturer = raw.Man || '';
            ac.squawk = raw.Sqk != null ? raw.Sqk.toString() : '';
            ac.latitude = raw.Lat ?? null;
            ac.longitude = raw.Long ?? null;
            ac.altitude = raw.Alt != null ? raw.Alt * CONST_FEET_TO_METER : 0;
            ac.heading = raw.Trak ?? 0;
            ac.velocity = raw.Spd != null ? raw.Spd * KNOT_TO_MPS : 0;
            ac.verticalRate = raw.Vsi != null ? raw.Vsi * FPM_TO_MPS : 0;
            ac.onGround = !!raw.Gnd;
            ac.spi = !!raw.Help;
            // VirtualRadar "Species" does not map cleanly to MAVLink emitter
            // types, so we leave emitterType at NO_INFO (0).
            ac.emitterType = 0;
            ac.lastContact = raw.PosTime != null ? raw.PosTime : now;
            ac.lastPosition = raw.PosTime != null ? raw.PosTime : null;
            out.push(ac);
        }
        return out;
    }
}

export default AdsbExchangeProvider;
