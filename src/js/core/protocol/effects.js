/**
 * TASK-02 — fn_effects: pure outbound-command declaration.
 *
 * Takes a unit, a decoded Message, and the reduce result. Returns the
 * Commands the runtime should send (via the facade) after applying patches.
 * Does NOT call the facade, does NOT touch globals or the DOM. This
 * inversion — returning what should be sent instead of sending it — is what
 * breaks the parser<->facade cycle.
 */

import { CONST_TYPE_AndruavMessage_ID } from '../../protocol/messages/js_andruavMessages.js';
import { reduceIDEffects } from './reduce.js';

/**
 * @param {object} unit
 * @param {import('./types.js').Message} msg
 * @param {object} [reduceResult] - the result from fn_reduce (for ID effects)
 * @returns {import('./types.js').Command[]}
 */
export function fn_effects(unit, msg, reduceResult) {
    switch (msg.type) {
        case CONST_TYPE_AndruavMessage_ID:
            return reduceIDEffects(unit, reduceResult);
        default:
            // No migrated message type produces outbound commands yet.
            // When SDR/P2P/RemoteExecute/GeoFenceAttachStatus are migrated,
            // their API_request* calls become Command objects returned here.
            return [];
    }
}
