import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'
import * as js_andruavMessages from '../../js/js_andruavMessages'


export  class Clss_RX_MESSAGE  extends React.Component {

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

    fn_unitUpdated (p_me,p_andruavUnit)
    {
        if (p_me.props.p_unit.partyID !== p_andruavUnit.partyID) return ;
        if (p_me.state.m_update === 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }
    

    render () {

        var msg = [];

        const msg_in = this.props.p_unit.m_Messages.m_messages_in;
        const msg_in_mavlink = this.props.p_unit.m_Messages.m_messages_in_mavlink;

        var i =0;
          Object.keys(msg_in).forEach(key => {
            i+=1;
            if (js_andruavMessages.message_names[key]==null)
            {
                js_andruavMessages.message_names[key] = key;
            }
            msg.push(
                <tr key={key + i}>
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
            var key_val = i.toString();
            
            msg.push(
                <tr key={key + i}>
                    <td className="text-success">
                        <small>{"MAV >> " + js_andruavMessages.message_names[key]}</small>
                    </td>
                    <td>
                        <small>{msg_in_mavlink[key]}</small>
                    </td>
                </tr>);
          });

        return  (<div key={'Clss_RX_MESSAGE' + this.props.p_unit.partyID } className="">
            <table className = "table table-dark table-striped">
                <thead>
                    <tr key={'Clss_RX_MESSAGE1' + this.props.p_unit.partyID }>
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
