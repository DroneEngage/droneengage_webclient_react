/**
 * ADSB aircraft registry (singleton).
 *
 * Holds the normalized aircraft currently known to the UI. The map layer in
 * js_main.js iterates `js_adsbUnit.List` and reads the `m_*` fields below to
 * render markers, so those field names are the rendering contract and must stay
 * stable. Providers feed the registry through `updateFromNormalized()`.
 *
 * Auth: Mohammad Hefny
 */

/**
 * A registered ADSB aircraft. Field names with the `m_` prefix are the
 * rendering contract consumed by js_main.js (fn_adsbObjectUpdate /
 * fn_adsbExpiredUpdate). Do not rename them without updating the map layer.
 */
export class CADSBObject {
    constructor(icao_address) {
        this.m_icao_address = icao_address;   // ICAO 24-bit hex string (key)
        this.m_callsign = '';
        this.m_emitter_type = 0;              // MAVLink ADSB_EMITTER_TYPE_*
        this.m_lat = null;
        this.m_lon = null;
        this.m_altitude = 0;                  // barometric altitude in meters
        this.m_geo_altitude = null;           // geometric altitude in meters
        this.m_heading = 0;                   // degrees
        this.m_velocity = 0;                  // m/s
        this.m_vertical_rate = 0;             // m/s
        this.m_on_ground = false;
        this.m_squawk = '';
        this.m_origin_country = '';           // origin country
        this.m_spi = false;                   // special purpose indicator
        this.m_position_source = null;        // 0=ADS-B,1=ASTERIX,2=MLAT,3=FLARM
        this.m_last_access = new Date();      // last update time (Date)

        // Render-side attachment (owned by the map layer).
        this.p_marker = null;
    }

    /**
     * Update this object from a normalized AdsbAircraft produced by a provider.
     * Keeps the `m_*` rendering fields in sync with the normalized shape.
     */
    updateFromNormalized(aircraft) {
        this.m_icao_address = aircraft.icao;
        this.m_callsign = aircraft.callsign || '';
        this.m_emitter_type = aircraft.emitterType ?? 0;
        this.m_lat = aircraft.latitude;
        this.m_lon = aircraft.longitude;
        this.m_altitude = aircraft.altitude ?? 0;
        this.m_geo_altitude = aircraft.geoAltitude ?? null;
        // Providers store heading in degrees; the map renderer expects radians
        // (fn_setPosition_bylatlng does p_yaw * 180/Math.PI).
        this.m_heading = (aircraft.heading != null) ? aircraft.heading * Math.PI / 180 : 0;
        this.m_velocity = aircraft.velocity ?? 0;
        this.m_vertical_rate = aircraft.verticalRate ?? 0;
        this.m_on_ground = !!aircraft.onGround;
        this.m_squawk = aircraft.squawk || '';
        this.m_origin_country = aircraft.originCountry || '';
        this.m_spi = !!aircraft.spi;
        this.m_position_source = aircraft.positionSource ?? null;
        // m_last_access drives the purge/hide window (fn_purgeOlderThan and
        // fn_adsbExpiredUpdate). It MUST be the time we last RECEIVED this
        // aircraft in a response, NOT the provider's last_contact — OpenSky's
        // last_contact is when the transponder was last heard by any receiver
        // and can lag the fetch by tens of seconds, which silently shrinks the
        // effective OBJECT_TIMEOUT_MS and makes planes vanish after a single
        // missed poll. Using receive time makes OBJECT_TIMEOUT_MS mean exactly
        // "absence tolerance" (how long a plane can be missing from responses).
        this.m_last_access = new Date();
    }
}

class CADSBObjectList {
    constructor() {
        this.List = {};
        this.count = 0;
    }

    static getInstance() {
        if (!CADSBObjectList.instance) {
            CADSBObjectList.instance = new CADSBObjectList();
        }
        return CADSBObjectList.instance;
    }

    Add(icao_address, adsb_object) {
        const key = icao_address.toString();
        this.List[key] = adsb_object;
        this.count = this.count + 1;
    }

    Del(icao_address) {
        const key = icao_address.toString();
        if (this.List.hasOwnProperty(key)) {
            delete this.List[key];
            this.count = this.count - 1;
        }
    }

    fn_getADSBObject(icao_address) {
        if (icao_address === null || icao_address === undefined) return null;
        const key = icao_address.toString();
        if (this.List.hasOwnProperty(key)) {
            return this.List[key];
        }
        return null;
    }

    /**
     * Merge a batch of normalized aircraft from a provider into the registry.
     * New aircraft are added; existing ones are updated in place. Returns the
     * list of ICAO keys that were touched (seen this cycle).
     * @param {AdsbAircraft[]} aircraftList
     * @returns {string[]}
     */
    fn_mergeNormalized(aircraftList) {
        const seen = [];
        for (const ac of aircraftList) {
            if (!ac || !ac.icao) continue;
            const key = ac.icao.toString();
            let obj = this.List[key];
            if (obj) {
                obj.updateFromNormalized(ac);
            } else {
                obj = new CADSBObject(ac.icao);
                obj.updateFromNormalized(ac);
                this.Add(key, obj);
            }
            seen.push(key);
        }
        return seen;
    }

    /** Remove aircraft not seen since `beforeMs` (ms epoch). */
    fn_purgeOlderThan(beforeMs) {
        const keys = Object.keys(this.List);
        for (const key of keys) {
            const obj = this.List[key];
            if (obj && obj.m_last_access && obj.m_last_access.getTime() < beforeMs) {
                this.Del(key);
            }
        }
    }

    /** Clear the entire registry (e.g. when ADSB is disabled). */
    fn_clear() {
        this.List = {};
        this.count = 0;
    }
}


export const js_adsbUnit = CADSBObjectList.getInstance();
