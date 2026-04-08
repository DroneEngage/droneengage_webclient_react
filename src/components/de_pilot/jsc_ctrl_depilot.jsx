import React from 'react';
import { withTranslation } from 'react-i18next';
import ClssCtrlDEPilotControl from './jsc_ctrl_depilot_control.jsx';

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

export default withTranslation()(ClssCtrlDEPilot);
