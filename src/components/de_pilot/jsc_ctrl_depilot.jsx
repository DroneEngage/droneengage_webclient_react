import React from 'react';
import { ClssCtrlDEPilotControl } from './jsc_ctrl_depilot_control.jsx';

export class ClssCtrlDEPilot extends React.Component {
    render() {
        const { v_andruavUnit, id, isHUD, ...otherProps } = this.props;
        
        return (
            <ClssCtrlDEPilotControl 
                p_unit={v_andruavUnit}
                id={id}
                isHUD={isHUD}
                {...otherProps}
            />
        );
    }
}
