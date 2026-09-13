import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';
import Draggable from "react-draggable";

import ClssPreclandStatusPanel from '../gadgets/jsc_ctrl_precland_status.jsx'
import ClssDialogBase from './jsc_dialog_base.jsx';
import { fn_closeDialog as fn_closeDialogService } from '../../js/app/dialogService.js';

export default class ClssPreclandDialog extends ClssDialogBase
{
    constructor()
    {
        super();
        this.state = {
			...this.state,
			'm_update': 0,
		};

        this.m_flag_mounted = false;

        this.key = Math.random().toString();

        this.modal_ctrl_precland = React.createRef();
    }

    componentDidMount () {
        this.modalRef = this.modal_ctrl_precland;
        super.componentDidMount();
        this.m_flag_mounted = true;
        if (this.props.dialogProps) this.fn_displayDialog(this, this.props.dialogProps?.unit);
    }


    componentWillUnmount ()
    {
    }


    fn_displayDialog(p_me, p_andruavUnit)
    {
        if (p_andruavUnit == null) {
		    return;
		}

        p_me.p_andruavUnit = p_andruavUnit;

        if (p_me.m_flag_mounted === false)return ;

        p_me.setState({'m_update': p_me.state.m_update +1});

        p_me.modal_ctrl_precland.current.style.display = 'block';
    }


    fn_initDialog() {
        this.modal_ctrl_precland.current.style.display = 'none';
        super.fn_initDialog();
    }

    fn_closeDialog()
    {
        fn_closeDialogService();
    }


    fn_getCurrentPartyID() {
        if (this.p_andruavUnit) {
            return this.p_andruavUnit.getPartyID();
        }
        return null;
    }

    render()
    {
        // Precision landing dialog is desktop-only — the feature is not
        // available on mobile. DialogHost does not pass p_compact, so the
        // body.mobile-mode flag (toggled by mobile.js on mount/unmount) is
        // the same check used by jsc_main_context_menu.
        if (document.body.classList.contains('mobile-mode')) return null;

        let unitname = '';
        if (this.p_andruavUnit !== null && this.p_andruavUnit !== undefined)
        {
            unitname = this.p_andruavUnit.m_unitName;
        }

        return (
            <Draggable nodeRef={this.modal_ctrl_precland} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div  key={this.key + "m0"} id="modal_ctrl_precland" title="Precision Landing" className="card css_ontop border-light p-2" style={{ width: '260px' }} ref={this.modal_ctrl_precland}>
					{this.fn_renderDialogHeader('Precision Landing - ' + unitname)}
					{!this.state.isMinimized && (
					<div key={this.key + "m2"} className="card-body">
						<ClssPreclandStatusPanel p_unit={this.p_andruavUnit}/>
					</div>
					)}
				</div>
            </Draggable>
        );
    }

}
