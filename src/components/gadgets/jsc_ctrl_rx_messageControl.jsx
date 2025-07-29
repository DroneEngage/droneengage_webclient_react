import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/js_andruavMessages'


export  class ClssRX_MESSAGE  extends React.Component {

    constructor(props)
    {
        super(props);
        this.state={
            m_message: [],
		    'm_update': 0
        };
        js_eventEmitter.fn_subscribe (js_globals.EE_unitUpdated,this,this.fn_unitUpdated);
    }

    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_unitUpdated,this);
    }
    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if the 'p_unit' prop has changed, or if the internal update state has changed.
        // You might want to do a deep comparison if p_unit.m_Messages.m_messages_in or m_messages_in_mavlink
        // are frequently updated with new objects but the content within them doesn't change meaningfully.
        // For simple reference equality, this is a good start.
        return nextProps.p_unit !== this.props.p_unit || nextState.m_update !== this.state.m_update;
    }

    fn_unitUpdated (p_me,p_andruavUnit)
    {
        if (p_me.props.p_unit.partyID !== p_andruavUnit.partyID) return ;
        if (p_me.state.m_update === 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }
    

    render () {

        let msg = [];

        const msg_in = this.props.p_unit.m_Messages.m_messages_in;
        const msg_in_mavlink = this.props.p_unit.m_Messages.m_messages_in_mavlink;

        let i =0;
          Object.keys(msg_in).forEach(key => {
            i+=1;
            if (js_andruavMessages.message_names[key]==null)
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
            i+=1;
            if (js_andruavMessages.message_names[key]==null)
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

        return  (<div key={'ClssRX_MESSAGE' + this.props.p_unit.partyID } className=" h-100 overflow-scroll">
            <table className = "table table-dark table-striped si-09x">
                <thead>
                    <tr key={'ClssRX_MESSAGE1' + this.props.p_unit.partyID }>
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

}
