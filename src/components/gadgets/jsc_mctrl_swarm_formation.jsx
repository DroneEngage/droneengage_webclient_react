import React from 'react';

import * as js_siteConfig from '../../js/js_siteConfig.js'
import * as js_andruavMessages from '../../js/js_andruavMessages'
import { js_localStorage } from '../../js/js_localStorage'

/**
 * Properties:
 * @param {number} p_formation_as_leader - 1 or 2
 * @param {boolean} p_editable - Indicates if the formation can be changed
 * @param {boolean} p_hidden - Indicates if the component should be hidden [for example when drone is not a leader in webclient]
 * @param {function} OnFormationChanged - Callback function when formation changes
 */
export class ClssCtrlSWARMFormation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            m_update: 0
        };

        this.key = Math.random().toString();
        
        this.m_flag_mounted = false;
        
        this.m_swarmFormation = React.createRef();
    }


    componentDidMount() {
        this.m_flag_mounted = true;
    }


    fn_ChangeFormation(e) {
        
        if (!this.props.p_formation_as_leader) return ;

        if (this.props.p_editable === true) {
            let newFormation = this.props.p_formation_as_leader + 1;
            if (newFormation >= 3) {
                newFormation = 1;
            }

            if (this.props.OnFormationChanged) {
                this.props.OnFormationChanged(newFormation);
            }
        }
    }

    render() {
        if ((this.props.p_hidden===true) || (js_siteConfig.CONST_FEATURE.DISABLE_SWARM === true) || (js_localStorage.fn_getAdvancedOptionsEnabled() !== true)) {
            return (
                <div></div>
            )
        }

        let v_class_formation_as_leader = ' text-warning ';
        let v_title = 'formation as follower';
        let v_class_icon = 'bi bi-dice-5 text-warning';
        
        let v_editable = ' user-select-none ';
        if (this.props.p_editable === true) {
            v_editable = ' cursor_hand ';
            v_title = 'formation as leader';
            v_class_formation_as_leader = ' text-danger ';
            v_class_icon = 'bi bi-dice-5 text-danger';
        }
        
        return (
        <p key={'swr_213' + this.key} className={' si-07x css_sub_item_margin_zero  ' + v_editable +  v_class_formation_as_leader} title={v_title} onClick={(e)=>this.fn_ChangeFormation(e)}>{<i className={v_class_icon}></i>} {' ' + js_andruavMessages.swarm_formation_names[this.props.p_formation_as_leader]}</p>
        );
    }
}