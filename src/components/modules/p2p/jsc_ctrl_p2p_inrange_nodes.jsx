/**
 * @auth: Mohammad S. Hefny
 * 
 * Date: Apr - 2024
 */

import React    from 'react';
import * as js_session from '../../../js/state/session.js';

import * as js_helpers from '../../../js/js_helpers.js'
import { subscribeUnitField } from '../../../js/store/unitStore.js';


class ClssCtrlP2PInRangeNodeInfo  extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
                m_update: 0
		};

    } 

    render()
    {
        let css_connection_type = "";
        
        
        const v_andruavUnit = this.props.p_unit;
        const v_inrange_node = this.props.p_inrange_node;
        const unit = js_session.fn_getAndruavUnitList().fn_getUnit(v_inrange_node.partyID);
        let txt_node_name;

        let p2 = v_andruavUnit.getPartyID();
        if (unit!=null)
        {
            p2 = unit.getPartyID();
            txt_node_name = "  " + unit.m_unitName;
        }
        const p1 = v_andruavUnit.getPartyID();
        

        
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

        this.m_flag_mounted = false;
        this.m_unsubs = [];
    }


    componentWillUnmount () {
        this.m_flag_mounted = false;
        for (const fn of this.m_unsubs) fn();
        this.m_unsubs = [];
    }

    componentDidMount () 
    {
        this.m_flag_mounted = true;
        // Field-granular: re-render only when m_P2P.m_detected_node
        // changes, replacing the coarse EE_unitP2PUpdated trigger.
        const partyId = this.props.p_unit?.getPartyID();
        if (partyId) {
            const me = this;
            this.m_unsubs.push(subscribeUnitField(partyId, 'm_P2P.m_detected_node', () => {
                if (me.m_flag_mounted === false) return;
                me.setState({ 'm_update': me.state.m_update + 1 });
            }));
        }
    }


    render () 
    {
        const  v_andruavUnit = this.props.p_unit;
        let v_units = [];
        Object.entries(v_andruavUnit.m_P2P.m_detected_node).forEach(([partyID, inrange_node]) => {
            
            v_units.push( 
                    <ClssCtrlP2PInRangeNodeInfo key={v_andruavUnit.partID+partyID+'RANGE_NODE_INFO1'}  p_unit={v_andruavUnit} p_inrange_node={inrange_node} />
                );
        });
        
        let rendered=[];
        if (v_units.length === 0)
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
