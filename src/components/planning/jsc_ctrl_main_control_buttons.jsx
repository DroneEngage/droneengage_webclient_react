
import React from 'react';

import ClssMission_Container from './mission/jsc_ctrl_mission_items_control.jsx'


/**
 * Combined Mission Plans & Geo Fences panel.
 * Both live in a single list (see ClssMission_Container), so no tab
 * switching or duplicate mounting is needed here anymore.
 */
export default class ClssMain_Control_Buttons extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update: 0,
        };

        this.m_flag_mounted = false;

        this.key = Math.random().toString();
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    render() {

        return (
            <div className="col-12 padding_zero">
                <div id="c_missioncontrol_section" className="col-12">
                    <div id="c_missioncontrol" className="col col-sm-12 container-fluid localcontainer margin_zero css_margin_top_small">
                        <div className="row margin_zero">
                            <div className="col col-sm-12">
                                <ClssMission_Container />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}