/*jshint esversion: 6 */
/**
 * Regression test for the FORBIDDEN_BATCHED guard in js_eventEmitterConfig.js.
 *
 * Context: a prior version of the guard only checked a hand-enumerated list
 * of safety-critical events. It correctly caught e.g. arming/geofence/auth
 * events being accidentally batched, but a safety-critical event added to
 * BATCHED_EVENTS would have slipped through silently if it wasn't in the
 * hand-enumerated list.
 *
 * After TASK-03, the dialog events (EE_display and EE_hide) were removed from
 * the event list entirely (replaced by dialogService). The dialog-pattern
 * guard remains as a forward-looking safety net in case dialog events are
 * ever re-introduced. This test now validates the FORBIDDEN_BATCHED
 * hand-enumerated list guard instead, by simulating a batched event
 * colliding with a safety-critical event id.
 *
 * This test does not hand-enumerate a specific batched event id (that would
 * only prove today's BATCHED_EVENTS list is safe, not that the mechanism
 * itself works). Instead it mocks js_eventList so that EE_unitUpdated's id
 * — which js_eventEmitterConfig.js batches unconditionally — resolves to
 * the same underlying value as a real safety-critical event's id. That
 * simulates "a batched event turns out to be a safety-critical event"
 * without touching the real BATCHED_EVENTS array, so the test stays valid
 * regardless of future edits to that list.
 */

describe('js_eventEmitterConfig FORBIDDEN_BATCHED dialog-pattern guard', () => {
    afterEach(() => {
        jest.resetModules();
        jest.dontMock('./js_eventList');
    });

    test('refuses to batch an event whose id collides with a forbidden event', () => {
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
                    // with a real safety-critical event (EE_onChatMessage
                    // is in FORBIDDEN_BATCHED).
                    EE_unitUpdated: actual.EVENTS.EE_onChatMessage,
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
