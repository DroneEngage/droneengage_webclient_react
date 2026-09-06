/*jshint esversion: 11 */
/**
 * unitLayerRegistry — the single owner of per-unit map layer objects.
 *
 * Replaces CAndruavUnitObject.m_gui (the C_GUIHelper bag of Leaflet/Mapbox
 * markers) and the parallel js_globals.v_vehicle_gui registry.
 *
 * Lifetime is the MAP's, not the unit's: entries survive a unit object
 * being recreated (which is why v_vehicle_gui existed as a second copy),
 * and are removed only by fn_disposeUnitLayers. The old code leaked
 * markers when a unit disappeared because no removal path existed.
 *
 * Field names inside UnitLayers are intentionally identical to the old
 * C_GUIHelper field names so that call-site migration is a path change
 * only (p_andruavUnit.m_gui.m_marker -> layers.m_marker).
 */
import { js_leafletmap } from '../../maps/js_leafletmap.js';

/**
 * @typedef {Object} UnitLayers
 * @property {*} m_marker                 - Leaflet vehicle marker (null until created)
 * @property {*} m_marker_destination     - Leaflet destination marker
 * @property {*} m_marker_home            - Leaflet home marker (added at runtime)
 * @property {Array} m_wayPoint_markers   - Leaflet waypoint marker array
 * @property {Array} m_wayPoint_polygons  - Leaflet waypoint polygon array
 * @property {*} m_mapObj                 - map object handle (legacy, mostly unused)
 * @property {boolean} m_marker3d_events_attached - render bookkeeping flag
 * @property {*} m_flightPath_style       - Leaflet style object for flight path
 */

/**
 * Create a fresh UnitLayers bag with all fields null/empty.
 * Sealed so no one re-opens the bag with new fields at runtime.
 * @returns {UnitLayers}
 */
function fn_createUnitLayers() {
    const layers = {
        m_marker: null,
        m_marker_destination: null,
        m_marker_home: null,
        m_wayPoint_markers: [],
        m_wayPoint_polygons: [],
        m_mapObj: null,
        m_marker3d_events_attached: false,
        m_flightPath_style: null,
    };
    Object.seal(layers);
    return layers;
}

class CUnitLayerRegistry {
    constructor() {
        /** @type {Object<string, UnitLayers>} keyed by partyID */
        this.m_layers = {};
    }

    /**
     * Get the layers for a unit, or null if none exist yet.
     * @param {string} p_partyID
     * @returns {UnitLayers|null}
     */
    fn_get(p_partyID) {
        return this.m_layers[p_partyID] ?? null;
    }

    /**
     * Get the layers for a unit, creating a fresh (all-null) bag if none
     * exist yet. This is the primary entry point for render code.
     * @param {string} p_partyID
     * @returns {UnitLayers}
     */
    fn_getOrCreate(p_partyID) {
        let layers = this.m_layers[p_partyID];
        if (layers === undefined || layers === null) {
            layers = fn_createUnitLayers();
            this.m_layers[p_partyID] = layers;
        }
        return layers;
    }

    /**
     * Remove all map layers for a unit from the map, then drop the entry.
     *
     * NEW behaviour that did not exist before — the old code leaked markers
     * when a unit disappeared. This removes Leaflet items from the map
     * before dropping the registry entry.
     *
     * NOTE: Wiring this into a unit-removal path is a follow-up task.
     * Calling it for a merely-quiet unit would drop its markers prematurely.
     *
     * @param {string} p_partyID
     */
    fn_disposeUnitLayers(p_partyID) {
        const layers = this.m_layers[p_partyID];
        if (layers === undefined || layers === null) return;

        if (layers.m_marker !== null && layers.m_marker !== undefined) {
            js_leafletmap.fn_hideItem(layers.m_marker);
        }
        if (layers.m_marker_destination !== null && layers.m_marker_destination !== undefined) {
            js_leafletmap.fn_hideItem(layers.m_marker_destination);
        }
        if (layers.m_marker_home !== null && layers.m_marker_home !== undefined) {
            js_leafletmap.fn_hideItem(layers.m_marker_home.home_marker ?? layers.m_marker_home);
        }
        if (layers.m_wayPoint_markers !== null && layers.m_wayPoint_markers !== undefined) {
            for (const m of layers.m_wayPoint_markers) {
                if (m !== null && m !== undefined) js_leafletmap.fn_hideItem(m);
            }
        }
        if (layers.m_wayPoint_polygons !== null && layers.m_wayPoint_polygons !== undefined) {
            for (const p of layers.m_wayPoint_polygons) {
                if (p !== null && p !== undefined) js_leafletmap.fn_hideItem(p);
            }
        }

        delete this.m_layers[p_partyID];
    }

    /**
     * Dispose all unit layers (e.g. on map teardown).
     */
    fn_disposeAll() {
        const partyIDs = Object.keys(this.m_layers);
        for (const id of partyIDs) {
            this.fn_disposeUnitLayers(id);
        }
    }
}

export const js_unitLayerRegistry = new CUnitLayerRegistry();
