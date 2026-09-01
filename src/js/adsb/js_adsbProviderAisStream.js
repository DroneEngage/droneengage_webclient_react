/**
 * AIS Stream provider (via DroneEngage server plugin).
 *
 * This provider does NOT poll an HTTP endpoint like OpenSky or ADSB Exchange.
 * Instead it uses the DroneEngage system message bus:
 *   - On setQueryArea(): sends a CONST_TYPE_AndruavSystem_AisSub system
 *     message to the comm server, which holds the upstream aisstream.io
 *     WebSocket connection (API key stays server-side).
 *   - The server pushes AIS data back as CONST_TYPE_AndruavSystem_AisPush
 *     system messages, which are dispatched as EE_AisStream_Push events.
 *   - This provider listens for those events, converts each AIS position
 *     report into a normalized AdsbAircraft, and buffers it.
 *   - fetch() returns the buffered aircraft and clears the buffer.
 *     The manager's polling interval acts as a flush cycle.
 *
 * AIS is maritime (ships), not aircraft ADSB. The AdsbAircraft model is
 * stretched to carry vessels: MMSI becomes the `icao` key, Sog (knots) is
 * converted to m/s, and vessel navigation status is mapped to a rough
 * emitter type. Altitude is always 0 (surface).
 *
 * Auth: Mohammad Hefny
 */

import {
    AdsbProvider,
    AdsbAircraft,
} from './js_adsbProvider.js';
import { js_eventEmitter } from '../js_eventEmitter.js';
import { EVENTS as js_event } from '../js_eventList.js';
import * as js_andruav_ws from '../protocol/server_comm/js_andruav_ws.js';
import * as js_andruavMessages from '../protocol/messages/js_andruavMessages.js';

const KNOTS_TO_MS = 0.514444;

/**
 * Map AIS navigational status to a rough MAVLink ADSB_EMITTER_TYPE_*.
 * AIS nav status is about vessel state, not vessel type, so this is a
 * coarse approximation. We use SURFACE types for most vessels and
 * EMERGENCY_SURFACE for distress states.
 *
 * AIS NavigationalStatus values:
 *   0 under way using engine
 *   1 at anchor
 *   2 not under command
 *   3 restricted manoeuvrability
 *   4 constrained by her draught
 *   5 moored
 *   6 aground
 *   7 engaged in fishing
 *   8 under way sailing
 *   9 reserved (future)
 *   10 reserved (future)
 *   11 power-driven vessel towing astern
 *   12 power-driven vessel pushing ahead/towing alongside
 *   13-14 reserved
 *   15 undefined
 */
function aisNavStatusToEmitterType(navStatus) {
    if (navStatus == null) return 0;  // NO_INFO
    // Use SERVICE_SURFACE (18) for most vessel states, EMERGENCY_SURFACE (17)
    // for distress states (not under command, aground), and NO_INFO for
    // undefined/reserved.
    switch (navStatus) {
        case 2:  // not under command
        case 6:  // aground
            return 17;  // EMERGENCY_SURFACE
        case 7:  // engaged in fishing
            return 18;  // SERVICE_SURFACE (fishing vessel)
        default:
            if (navStatus >= 0 && navStatus <= 15) return 18;  // SERVICE_SURFACE
            return 0;  // NO_INFO
    }
}

export class AisStreamProvider extends AdsbProvider {
    /**
     * @param {object} [config]
     * @param {string} [config.url]   unused (connection is via DroneEngage WS)
     */
    constructor(config = {}, options = {}) {
        super(config, options);
        // AIS messages are event-driven; use a shorter flush interval.
        this.refreshRateMs = options.refreshRateMs ?? 5000;

        this._buffer = [];           // buffered AdsbAircraft waiting for fetch()
        this._subscribed = false;    // whether we've sent a subscribe message
        this._lastSubscribedArea = null;

        // Bind the push event handler.
        this._boundOnPush = this._onPush.bind(this);
        js_eventEmitter.fn_subscribe(js_event.EE_AisStream_Push, this, this._boundOnPush);
    }

    get id() {
        return 'aisstream';
    }

    /**
     * Handle an AIS push event from the DroneEngage server.
     * The payload is an array of normalized AIS position objects.
     * @param {object|Array} payload
     */
    _onPush(payload) {
        if (!payload) return;
        const items = Array.isArray(payload) ? payload : [payload];
        for (const item of items) {
            const ac = this._normalizeToAircraft(item);
            if (ac) {
                this._buffer.push(ac);
            }
        }
    }

    /**
     * Convert a normalized AIS position object (from the server plugin) into
     * an AdsbAircraft.
     */
    _normalizeToAircraft(item) {
        if (!item || item.mmsi == null || item.lat == null || item.lng == null) {
            return null;
        }

        const ac = new AdsbAircraft('MMSI:' + item.mmsi.toString());
        ac.callsign = item.shipName || '';
        ac.originCountry = '';  // AIS doesn't carry country info directly
        ac.latitude = Number(item.lat);
        ac.longitude = Number(item.lng);
        ac.altitude = 0;        // surface
        ac.geoAltitude = 0;
        ac.onGround = false;    // vessels are always "on water"
        ac.velocity = item.sog != null ? item.sog * KNOTS_TO_MS : 0;  // knots → m/s
        ac.heading = item.cog != null ? item.cog : (item.heading != null ? item.heading : 0);
        ac.verticalRate = 0;    // vessels don't change altitude
        ac.squawk = '';
        ac.spi = false;
        ac.emitterType = aisNavStatusToEmitterType(item.navStatus);
        ac.lastContact = item.ts || Date.now();
        ac.lastPosition = item.ts || Date.now();
        ac.positionSource = null;
        return ac;
    }

    /**
     * Override setQueryArea to send a subscribe system message to the server.
     * The server plugin manages the upstream aisstream.io connection.
     */
    setQueryArea(lat, lng, radius) {
        super.setQueryArea(lat, lng, radius);

        if (lat != null && radius > 0) {
            const areaKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius.toFixed(1)}`;
            if (this._lastSubscribedArea !== areaKey) {
                this._lastSubscribedArea = areaKey;
                this._sendSubscribe(true, lat, lng, radius);
                this._subscribed = true;
            }
        } else {
            // Area cleared — unsubscribe.
            if (this._subscribed) {
                this._sendSubscribe(false);
                this._subscribed = false;
                this._lastSubscribedArea = null;
            }
        }
    }

    /**
     * Send a subscribe/unsubscribe system message to the comm server.
     */
    _sendSubscribe(enable, lat, lng, radiusKm) {
        try {
            const ms = { en: enable };
            if (enable) {
                ms.lat = lat;
                ms.lng = lng;
                ms.radiusKm = radiusKm;
            }
            js_andruav_ws.AndruavClientWS._API_sendSYSCMD(
                js_andruavMessages.CONST_TYPE_AndruavSystem_AisSub,
                ms
            );
        } catch (e) {
            console.error('[aisstream] Failed to send subscribe message:', e);
        }
    }

    /**
     * Override fetch to return buffered AIS data (push model).
     * The manager's polling interval acts as a flush cycle.
     */
    async fetch(_lat, _lng, _radiusKm) {
        const batch = this._buffer;
        this._buffer = [];
        this.lastFetchAt = Date.now();
        return batch;
    }

    /**
     * Override stop to unsubscribe from the server when polling stops.
     */
    stop() {
        if (this._subscribed) {
            this._sendSubscribe(false);
            this._subscribed = false;
            this._lastSubscribedArea = null;
        }
        super.stop();
    }

    /**
     * Cleanup: unsubscribe from events when the provider is destroyed.
     */
    destroy() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_AisStream_Push, this);
        if (this._subscribed) {
            this._sendSubscribe(false);
            this._subscribed = false;
        }
    }
}

export default AisStreamProvider;
