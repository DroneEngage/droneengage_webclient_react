
import React from 'react';


import {js_leafletmap} from '../../js/js_leafletmap.js'


import ClssFence_Shape_Control from './fence/jsc_fence_shape_control.jsx'
import ClssMission_Container from './mission/jsc_ctrl_mission_items_control.jsx'



/**
 * Two main buttons Misson Plans & Geo Fence
 */
export default class ClssMain_Control_Buttons extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
            activeTab: 'missions', // Track the active tab
        };

        this.key = Math.random().toString();


        // Create refs for the sections
        this.missionControlRef = React.createRef();
        this.fenceControlRef = React.createRef();
        this.fenceGlobalRef = React.createRef();
    }

    componentDidMount() {
        this.state.m_update = 1;
    }


    fn_missionTab() {
            // Show/hide sections using refs
            if (this.missionControlRef.current) {
                this.missionControlRef.current.style.display = 'block';
            }
            if (this.fenceControlRef.current) {
                this.fenceControlRef.current.style.display = 'none';
            }
            if (this.fenceGlobalRef.current) {
                this.fenceGlobalRef.current.style.display = 'none';
            }

            // Enable mission controls
            js_leafletmap.fn_enableDrawMarker(true);
            js_leafletmap.fn_enableDrawLine(false);
            js_leafletmap.fn_enableDrawCircle(false);
            js_leafletmap.fn_enableDrawPolygon(false);
            js_leafletmap.fn_enableDrawRectangle(false);
        

        this.setState({ activeTab: 'missions' });
        
    }

    fn_geoFenceTab() {

        if (this.missionControlRef.current) {
            this.missionControlRef.current.style.display = 'none';
        }
        if (this.fenceControlRef.current) {
            this.fenceControlRef.current.style.display = 'block';
        }
        if (this.fenceGlobalRef.current) {
            this.fenceGlobalRef.current.style.display = 'block';
        }

        // Enable geofence controls
        js_leafletmap.fn_enableDrawMarker(false);
        js_leafletmap.fn_enableDrawLine(true);
        js_leafletmap.fn_enableDrawCircle(true);
        js_leafletmap.fn_enableDrawPolygon(true);
        js_leafletmap.fn_enableDrawRectangle(true);

        this.setState({ activeTab: 'geofences' });
    }


    render() {

        return (
            <div className="row">
            <div id="main_btn_group" className={`${this.props.className} btn-group`} role="group">
                <button
                    type="button"
                    id="btn_missions"
                    className={`btn btn-sm button_large ${this.state.activeTab === 'missions' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={(e) => this.fn_missionTab()}
                >
                    Mission Plans
                </button>
                <button
                    type="button"
                    id="btn_geofences"
                    className={`btn btn-sm button_large ${this.state.activeTab === 'geofences' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={(e) => this.fn_geoFenceTab()}
                >
                    Geo Fences
                </button>
            </div>

            <div ref={this.missionControlRef} id="c_missioncontrol_section" className="row" style={{ display: this.state.activeTab === 'missions' ? 'block' : 'none' }}>
                <div id="c_missioncontrol" className="col col-sm-12 container-fluid localcontainer">
                    <ClssMission_Container />
                </div>
            </div>

            <div ref={this.fenceControlRef} id="fenceControl_section" className="row" style={{ display: this.state.activeTab === 'geofences' ? 'block' : 'none' }}>
                <div id="fenceControl" className="col col-sm-12 m-1 p-1">
                    <ClssFence_Shape_Control />
                </div>
            </div>

            <div ref={this.fenceGlobalRef} id="fence_global_section" className="row" style={{ display: this.state.activeTab === 'geofences' ? 'block' : 'none' }}>
                {/* <div id="fence_global" className="col col-sm-12 container-fluid localcontainer">
                    <ClssFenceGlobalSettingsControl />
                </div> */}
            </div>
        </div>
        );
    }

}