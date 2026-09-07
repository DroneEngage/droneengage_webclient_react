/**
 * TASK-02 / TASK-06 — fn_effects: pure outbound-command declaration.
 *
 * Takes a unit, a decoded Message, and the reduce result. Returns the
 * Commands the runtime should send (via the facade) after applying patches.
 * Does NOT call the facade, does NOT touch globals or the DOM. This
 * inversion — returning what should be sent instead of sending it — is what
 * breaks the parser<->facade cycle.
 */

import { CONST_TYPE_AndruavMessage_ID,
         CONST_TYPE_AndruavMessage_RemoteExecute } from '../../protocol/messages/js_andruavMessages.js';
import { reduceIDEffects } from './reduce';
import type { Message, Command, ReduceResult } from './types';
import type { CAndruavUnit } from '../model/unit';

/**
 * @param unit - the unit the message was received for.
 * @param msg - the decoded inbound message.
 * @param reduceResult - the result from fn_reduce (for ID effects).
 */
export function fn_effects(unit: CAndruavUnit, msg: Message, reduceResult?: ReduceResult): Command[] {
    switch (msg.type) {
        case CONST_TYPE_AndruavMessage_ID:
            return reduceIDEffects(unit, reduceResult);
        case CONST_TYPE_AndruavMessage_RemoteExecute:
            // The old sub-switch calls API_sendID when p_jmsg.C === CONST_TYPE_AndruavMessage_ID.
            if (reduceResult && reduceResult.remoteExecuteC === CONST_TYPE_AndruavMessage_ID) {
                return [{ kind: 'SEND_ID' }];
            }
            return [];
        default:
            return [];
    }
}
