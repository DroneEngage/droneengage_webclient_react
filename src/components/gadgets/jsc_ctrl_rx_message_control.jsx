import React, { useState, useCallback } from 'react';

import {EVENTS as js_event} from '../../js/events/js_eventList.js'
import { useEventSubscription } from '../../js/hooks/useEventSubscription.js'
import * as js_andruavMessages from '../../js/protocol/messages/js_andruavMessages'


export function ClssRX_MESSAGE({ p_unit }) {
    const [, setTick] = useState(0);

    const fn_unitUpdated = useCallback((p_andruavUnit) => {
        if (p_unit.getPartyID() !== p_andruavUnit.getPartyID()) return;
        setTick((t) => t + 1);
    }, [p_unit]);

    useEventSubscription(js_event.EE_unitUpdated, fn_unitUpdated);

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
