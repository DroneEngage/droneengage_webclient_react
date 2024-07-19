/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Apr - 2024
 */

import React    from 'react';

import * as js_helpers from '../../js/js_helpers'
import {js_globals} from '../../js/js_globals.js';
import {js_eventEmitter} from '../../js/js_eventEmitter'


class Clss_CtrlP2PInRangeNodeInfo  extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

    } 

    render()
    {
        var css_connection_type = "";
        
        
        const v_andruavUnit = this.props.p_unit;
        const v_inrange_node = this.props.p_inrange_node;
        const unit = window.AndruavLibs.AndruavClient.m_andruavUnitList.fn_getUnit(v_inrange_node.partyID);
        var txt_node_name;

        var p2 = v_andruavUnit.partyID;
        if (unit!=null)
        {
            p2 = unit.partyID;
            txt_node_name = "  " + unit.m_unitName;
        }
        const p1 = v_andruavUnit.partyID;
        

        
        return (
            <div key={p1  + p2 + 'irn_1'} className='row css_margin_zero padding_zero  '>

                        <div key={p1 + p2 + 'irn_11'} className="col-6 ">
                            <div key={p1 + p2 + 'irn_111'} className='row css_margin_zero padding_zero '>
                                <p key={p1 + p2 + 'irn_1111'} className="textunit_nowidth user-select-all m-0"><span><small><b>MAC&nbsp; <span className={css_connection_type} ><b>{v_inrange_node.mac}</b></span></b></small></span></p>
                            </div>
                        </div>
                        <div key={p1 + p2 + 'irn_21'} className="col-6 ">
                            <div key={p1 + p2 + 'irn_212'} className='row css_margin_zero padding_zero '>
                                <p key={p1 + p2 + 'irn_2121'} className="textunit_nowidth user-select-all m-0"><span><small><b>UNIT&nbsp; <span className='text-success'>{txt_node_name}</span><span className='text-warning' ><b>: {js_helpers.fn_getTimeDiffDetails_Shortest (v_inrange_node.last_time/1000000)}</b></span></b></small></span></p>
                            </div>
                        </div>
            </div>
            
        );
    }

    }

export class CLASS_CTRL_P2P_IN_RANGE_NODEs extends React.Component {

    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

        js_eventEmitter.fn_subscribe (js_globals.EE_unitP2PUpdated,this,this.fn_unitUpdated);
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_unitP2PUpdated,this);
    }

    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    fn_unitUpdated (p_me,p_andruavUnit)
    {
        if (p_me._isMounted !== true) return ;

        if (p_me.props.p_unit.partyID !== p_andruavUnit.partyID) return ;
        if (p_me.state.m_update === 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }


    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        var v_units = [];
        Object.entries(v_andruavUnit.m_P2P.m_detected_node).forEach(([partyID, inrange_node]) => {
            
            v_units.push( 
                    <Clss_CtrlP2PInRangeNodeInfo key={v_andruavUnit.partID+partyID+'RANGE_NODE_INFO1'}  p_unit={v_andruavUnit} p_inrange_node={inrange_node} />
                );
        });
        
        var rendered=[];
        if (v_units.length===0)
        {
            rendered.push (
                <div key={v_andruavUnit.partID+'RANGE_NODE_INFO00'} className='row css_margin_zero padding_zero border-top border-secondary' >
                <div className='col-12 user-select-none textunit_nowidth text-danger'>No&nbsp;Pinging&nbsp;Nodes</div>
                </div>);
        }
        else
        {
            rendered.push (   <div key={v_andruavUnit.partID+'RANGE_NODE_INFO00'} className='row css_margin_zero padding_zero border-top border-secondary' >
                <div className='col-12 user-select-none textunit_nowidth text-info'><b>&nbsp;Pinging&nbsp;Nodes</b></div>
                </div>);
        }
        
        
        return (
            <div key={v_andruavUnit.partID+'RANGE_NODE_INFO'} >{rendered}{v_units}</div>
        )
    }
}
