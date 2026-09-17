/*
MAVLink v2 adapter for the DroneEngage webclient.

The actual implementation is the auto-generated NextGen output in
./mavlink_generated/mavlink.js (pymavlink mavgen_javascript.py, all.xml,
wire protocol 2.0). Regenerate it with ./mavlink_generated/regen.sh.

The generated code stores message internals under underscore-prefixed names
(_id, _name, _format, _header, _msgbuf, _payload) so they cannot collide with
payload fields that share those names (e.g. DISTANCE_SENSOR.id,
NAMED_VALUE_INT.name). The getters below restore the pre-PR431 API surface
this app was written against. Because getters live on the shared prototype,
an own field of the same name (a real 'id' or 'name' payload field) shadows
the getter and wins, so both readings stay correct.
*/
// require() so webpack hands us the raw CommonJS exports object without
// needing to statically detect export names in the generated file
const generated = require('./mavlink_generated/mavlink.js');

export const mavlink20 = generated.mavlink20;
export const MAVLink20Processor = generated.MAVLink20Processor;

const compat = {
    id: '_id',
    name: '_name',
    format: '_format',
    header: '_header',
    msgbuf: '_msgbuf',
    payload: '_payload',
    data: '_data',
    reason: '_reason',
};

for (const pub of Object.keys(compat)) {
    Object.defineProperty(mavlink20.message.prototype, pub, {
        // read: falls back to the underscore internal when the message has no
        // payload field of this name
        get: function () { return this[compat[pub]]; },
        // write: materializes a real own property (a payload field like
        // DISTANCE_SENSOR.id) which then shadows this accessor for reads too
        set: function (v) {
            Object.defineProperty(this, pub, {
                value: v, writable: true, enumerable: true, configurable: true,
            });
        },
        configurable: true,
    });
}
