/*jshint esversion: 6 */
/**
 * Model test for CAndruavUnitObject.
 *
 * This is the "real acceptance test" for TASK-01: the unit domain entity
 * must be constructible and usable with NO DOM, NO map, and NO
 * jsdom-dependent import. After removing C_GUIHelper (which held live
 * Leaflet marker instances), the unit is plain data.
 *
 * The test runner (react-scripts test = jest + jsdom) provides a DOM
 * environment, but this test does not rely on it — it only exercises
 * the domain model: party ID, navigation info, flight path history,
 * and the module sub-objects created by init().
 */
import { CAndruavUnitObject, VEHICLE_QUAD } from './js_andruavUnit.js';

describe('CAndruavUnitObject model (no DOM/map dependency)', () => {
    test('can be constructed and initialized without any map or DOM import', () => {
        const unit = new CAndruavUnitObject();
        unit.init();

        // The unit no longer has a C_GUIHelper or any m_gui field.
        expect(unit.m_gui).toBeUndefined();
        expect(unit.m_flightPathHistory).toBeDefined();
        expect(typeof unit.m_flightPathHistory.fn_add).toBe('function');
        expect(typeof unit.m_flightPathHistory.fn_flush).toBe('function');
    });

    test('party ID round-trips', () => {
        const unit = new CAndruavUnitObject();
        unit.init();
        unit.setPartyID('party-test-01');

        expect(unit.getPartyID()).toBe('party-test-01');
    });

    test('navigation position can be set and read', () => {
        const unit = new CAndruavUnitObject();
        unit.init();
        unit.setPartyID('party-test-02');
        unit.m_unitName = 'TestDrone';

        // Set position via the Nav_Info sub-object (domain data, not view)
        unit.m_Nav_Info.p_Location.lat = 30.05;
        unit.m_Nav_Info.p_Location.lng = 31.23;
        unit.m_Nav_Info.p_Location.alt_relative = 50;
        unit.m_Nav_Info.p_Location.ground_speed = 15.5;

        expect(unit.m_Nav_Info.p_Location.lat).toBe(30.05);
        expect(unit.m_Nav_Info.p_Location.lng).toBe(31.23);
        expect(unit.m_Nav_Info.p_Location.alt_relative).toBe(50);
        expect(unit.m_Nav_Info.p_Location.ground_speed).toBe(15.5);
    });

    test('vehicle type is plain data', () => {
        const unit = new CAndruavUnitObject();
        unit.init();
        unit.m_VehicleType = VEHICLE_QUAD;

        expect(unit.m_VehicleType).toBe(VEHICLE_QUAD);
    });

    test('fn_resetOnBoardConnection preserves party ID and flight path history is recreated', () => {
        const unit = new CAndruavUnitObject();
        unit.init();
        unit.setPartyID('party-test-03');
        unit.m_defined = true;

        const originalBuffer = unit.m_flightPathHistory;
        unit.fn_resetOnBoardConnection({});

        // Party ID survives the reset
        expect(unit.getPartyID()).toBe('party-test-03');
        expect(unit.m_defined).toBe(true);
        // Flight path history is recreated (fresh buffer)
        expect(unit.m_flightPathHistory).toBeDefined();
        expect(unit.m_flightPathHistory).not.toBe(originalBuffer);
    });

    test('module sub-objects are created by init()', () => {
        const unit = new CAndruavUnitObject();
        unit.init();

        // These are all domain sub-objects, not view objects
        expect(unit.m_modules).toBeDefined();
        expect(unit.m_GPIOs).toBeDefined();
        expect(unit.m_Messages).toBeDefined();
        expect(unit.m_Power).toBeDefined();
        expect(unit.m_GPS_Info1).toBeDefined();
        expect(unit.m_Nav_Info).toBeDefined();
        expect(unit.m_Geo_Tags).toBeDefined();
        expect(unit.m_Telemetry).toBeDefined();
    });
});
