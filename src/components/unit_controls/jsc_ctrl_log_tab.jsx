import React    from 'react';

import {js_globals} from '../../js/js_globals.js';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

class ClssAndruavMessageItem extends React.Component {

    constructor(props) {
        super(props);
    }
    
    render () 
    {
        let v_text_color = " text-white ";
        switch (this.props.p_msg.m_msg.m_error.notification_Type)
        {
            case 0:
            case 1:
            case 2:
            case 3:
                v_text_color = " text-danger ";
                break;
            case 4:
                v_text_color = " text-warning ";
                break;
            case 5:
            case 6:
            case 7:
                v_text_color = " text-success ";
                break;
            default:
                break;
        }

        const m_time = this.props.p_msg.time;
        const m_notification_Type = this.props.p_msg.m_msg.m_notification_Type;
        const m_description = this.props.p_msg.m_msg.m_error.Description;
        const m_index = this.props.p_index;
        return (
        <tr key={m_index} className = {'si-09x ' + v_text_color + this.props.className}>
            <td  scope="row">{m_time}</td>
            <td scope="row">{m_notification_Type}</td>
            <td scope="row">{m_description}</td>
        </tr>
        );
    }
}

export  class ClssCtrlUnitLog  extends React.Component {

    constructor(props)
    {
        super(props);
        this.state={
            m_message: [],
		    'm_update': 0
        };
        
        js_eventEmitter.fn_subscribe (js_event.EE_onMessage, this, this.fn_onMessage);
    }

    shouldComponentUpdate(nextProps, nextState) {
        const update = (this.state.m_update != nextState.m_update);

        return update;
    }

    fn_onMessage (p_me, p_msg)
    {
        /*
            c_msg.m_unit = p_andruavUnit;
			c_msg.m_notification_Type = v_notification_Type;
			c_msg.m_cssclass = v_cssclass;
			c_msg.m_error = p_error
		*/

        if (p_me.props.p_unit.partyID !== p_msg.m_unit.partyID) return ;
        
        p_me.state.m_message.push ({
            m_msg: p_msg,
            time: (new Date()).toLocaleTimeString()
        });

        
        if (p_me.state.m_update === 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    componentDidMount() {
        this.state.m_update = 1;
    }

    fn_clear (e)
    {
        if (this.state.m_update === 0) return ;
        this.setState({'m_message':[], 'm_update': this.state.m_update +1});
    }

    componentWillUnmount () {
        this._isMounted = false;
		js_eventEmitter.fn_unsubscribe (js_event.EE_onMessage,this);
    }

    render () {
        let v_messages=[];

        //TODO: make paging here
        let len = this.state.m_message.length>0?this.state.m_message.length:0;
        let min = Math.max(len - js_globals.CONST_MAX_MESSAGE_LOG,0);
        for (let i=len-1; i>=min; --i) 
        {
            v_messages.push(<ClssAndruavMessageItem key={this.props.p_unit.partyID + "_log" + i} p_index={i} p_msg={this.state.m_message[i]}/>)
        }
        
        return (
            <div key={this.props.p_unit.partyID + "_msgctrl"} className="">
                 <div key='params' id="parameters_sublist" className='d-flex justify-content-end'>
                            <button type="button" className='btn btn-success btn-sm ctrlbtn me-5'  title='Clear Messages' onClick={(e) => this.fn_clear(e)}>Clear</button>
                 </div>
                 <table className = "table table-dark css_table_log si-09x ">
                    <thead>
                        <tr>
                        <th data-sort-type="text" className="w-25" scope="col">Time</th>
                        <th className="w-25" scope="col">Type</th>
                        <th data-sort-type="text" className="w-75" scope="col">Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {v_messages}
                    </tbody>
                </table>
            </div>
        ) 
    }
}

