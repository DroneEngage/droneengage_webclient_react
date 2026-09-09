import React from 'react';

import { useUnitField } from '../../js/hooks/useUnitField.js'
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'


export function ClssRX_MESSAGE({ p_unit }) {
    // Field-granular re-render: only re-render when the message counters
    // change, not on every coarse EE_unitUpdated for the whole unit.
    const _partyId = p_unit?.getPartyID();
    useUnitField(_partyId, 'm_Messages.m_messages_in');
    useUnitField(_partyId, 'm_Messages.m_received_msg');

    let msg = [];

    const msg_in = p_unit.m_Messages.m_messages_in;
    const msg_in_mavlink = p_unit.m_Messages.m_messages_in_mavlink;

    let i = 0;
    Object.keys(msg_in).forEach(key => {
        i += 1;
        if (js_andruavMessages.message_names[key] == null)
        {
            js_andruavMessages.message_names[key] = key;
        }
        msg.push(
            <tr key={key + i} className='si-09x'>
                <td>
                    <small>{js_andruavMessages.message_names[key]}</small>
                </td>
                <td>
                    <small>{msg_in[key]}</small>
                </td>
            </tr>);
    });
    Object.keys(msg_in_mavlink).forEach(key => {
        i += 1;
        if (js_andruavMessages.message_names[key] == null)
        {
            js_andruavMessages.message_names[key] = key;
        }

        msg.push(
            <tr key={key + i} className='si-09x'>
                <td className='text-success'>
                    <small>{"MAV >> " + js_andruavMessages.message_names[key]}</small>
                </td>
                <td>
                    <small>{msg_in_mavlink[key]}</small>
                </td>
            </tr>);
    });

    return (<div key={'ClssRX_MESSAGE' + p_unit.getPartyID()} className=" h-100 overflow-scroll">
        <table className="table table-dark table-striped si-09x">
            <thead>
                <tr key={'ClssRX_MESSAGE1' + p_unit.getPartyID()}>
                    <th scope="col">MSG&nbsp;ID</th>
                    <th scope="col">Count</th>
                </tr>
            </thead>
            <tbody>
                {msg}
            </tbody>
        </table>
   </div>);
}
