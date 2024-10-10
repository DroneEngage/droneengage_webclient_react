import React from 'react';

import * as js_andruavMessages from '../../js/js_andruavMessages';
import { js_globals } from '../../js/js_globals.js'
import { js_localStorage } from '../../js/js_localStorage.js'
import { js_leafletmap } from '../../js/js_leafletmap.js'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'
import { fn_doStartMissionFrom} from '../../js/js_main.js'



export class ClssWaypointStepContextMenu extends React.Component {
    constructor() {
        super();
        this.state = {

            initialized: false,
        };

        this.key = Math.random().toString();
    }


    componentWillUnmount() {

    }

    componentDidMount() {

        if (this.state.initialized === true) {
            return;
        }

        this.state.initialized = true;

    }


    render() {


        let v_style = " css_margin_5px ", v_icon = "";

			
			const v_footerMenu = (<div key={this.key + 'wp'} className='row'>
                <div className= 'col-12 flex justify-content-start'><p key={this.key + 'f1'} className='bg-success text-nowrap'>{this.props.p_unit.m_unitName + "   " + this.props.p_unit.m_VehicleType_TXT }</p></div>
                <div className= 'col-6'><p key={this.key + 'f2'} className='cursor_hand text-primary text-nowrap' onClick={() =>fn_doStartMissionFrom(this.props.p_unit.partyID , this.props.p_waypoint.m_Sequence)}>Start Here</p></div>
                </div>);
			

			let v_contentString = [];
			switch (this.props.p_waypoint.waypointType) {
				case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
					v_contentString.push(<p key={this.key + 'c1'} className={'img-rounded bg-primary text-white '+  v_style}><strong> {"Circle Seq#" + this.props.p_waypoint.m_Sequence + v_icon}</strong></p>);

                    v_contentString.push(<span key={this.key + 'c2'}  className='help-block'>{this.props.p_waypoint.Latitude + "," + this.props.p_waypoint.Longitude}</span>);
					v_contentString.push(<p key={this.key + 'c3'} className='text-primary'>{'radius:' + parseInt(this.props.p_waypoint.m_Radius).toFixed(1) + " m x" + parseInt(this.props.p_waypoint.m_Turns).toFixed(0)}</p>);
					v_contentString.push(v_footerMenu);

					break;
				default:
					v_contentString.push(<p key={this.key + 'd1'}  className={'img-rounded bg-primary text-white ' + v_style}><strong>{'Waypoint Seq#' + this.props.p_waypoint.m_Sequence + v_icon }</strong></p>);
                    //v_contentString.push(<span key={this.key + 'd2'}  className='help-block'>{ this.props.p_waypoint.Latitude + ',' + this.props.p_waypoint.Longitude}</span>);
                    v_contentString.push(<p key={this.key + 'd2'} className="text-primary margin_zero  " >
                        lat:<span className='si-09x text-success'>{this.props.p_waypoint.Latitude.toFixed(6)}</span> 
                    </p>);
                    v_contentString.push(<p key={this.key + 'd3'} className="text-primary margin_zero  " >
                        lng:<span className='si-09x text-success'>{this.props.p_waypoint.Longitude.toFixed(6)}</span>
                    </p>);
                    v_contentString.push(v_footerMenu);
					break;
			}

        return (
            v_contentString
        );
    }

}
