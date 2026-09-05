/*jshint esversion: 6 */
/**
 * Regression test for the FORBIDDEN_BATCHED dialog-name-pattern guard in
 * js_eventEmitterConfig.js.
 *
 * Context: a prior version of the guard only checked a hand-enumerated list
 * of safety-critical events. It correctly caught e.g. arming/geofence/auth
 * events being accidentally batched, but a dialog event (an EE_display or
 * EE_hide event, e.g. EE_displayAlertDialog) added to BATCHED_EVENTS would
 * have slipped through silently — the exact failure mode this guard exists
 * to prevent, and a direct contradiction of this file's own header comment
 * ("all EE_display / EE_hide dialog events" must stay immediate).
 *
 * This test does not hand-enumerate a specific batched event id (that would
 * only prove today's BATCHED_EVENTS list is safe, not that the mechanism
 * itself works). Instead it mocks js_eventList so that EE_unitUpdated's id
 * — which js_eventEmitterConfig.js batches unconditionally — resolves to
 * the same underlying value as a real dialog event's id. That simulates
 * "a batched event turns out to be a dialog event" without touching the
 * real BATCHED_EVENTS array, so the test stays valid regardless of future
 * edits to that list.
 */

describe('js_eventEmitterConfig FORBIDDEN_BATCHED dialog-pattern guard', () => {
    afterEach(() => {
        jest.resetModules();
        jest.dontMock('./js_eventList');
    });

    test('refuses to batch an event whose id collides with a dialog-pattern event', () => {
        jest.resetModules();
        jest.doMock('./js_eventList', () => {
            const actual = jest.requireActual('./js_eventList');
            return {
                __esModule: true,
                ...actual,
                EVENTS: {
                    ...actual.EVENTS,
                    // Simulate EE_unitUpdated (always batched by
                    // js_eventEmitterConfig.js) turning out to share an id
                    // with a real dialog event.
                    EE_unitUpdated: actual.EVENTS.EE_displayAlertDialog,
                },
            };
        });

        expect(() => {
            require('./js_eventEmitterConfig');
        }).toThrow(/refusing to batch safety-critical event/);
    });

    test('does not throw with the real, unmodified event list', () => {
        jest.resetModules();
        expect(() => {
            require('./js_eventEmitterConfig');
        }).not.toThrow();
    });
});
