import React from 'react';
import { withTranslation } from 'react-i18next';
import { fn_gotoUnit_byPartyID } from '../../js/js_main.js';
import { js_globals } from '../../js/js_globals.js';

class ClssDialogBase extends React.Component {
    constructor(props) {
        super(props);
        this.modalRef = React.createRef();
        this.state = {
            isMinimized: false,
            opaque_clicked: false,
        };
    }

    componentDidMount() {
        this.fn_initDialog();
    }

    fn_initDialog() {
        if (this.modalRef.current) {
            this.modalRef.current.style.opacity = '0.4';
            this.modalRef.current.onmouseover = () => {
                this.modalRef.current.style.opacity = '1.0';
            };
            this.modalRef.current.onmouseout = () => {
                this.modalRef.current.style.opacity = this.state.opaque_clicked ? '1.0' : '0.4';
            };
        }
    }

    fn_opacityDialog() {
        const newVal = !this.state.opaque_clicked;
        this.setState({ opaque_clicked: newVal });
        if (newVal && this.modalRef.current) {
            this.modalRef.current.style.opacity = '1.0';
        }
    }

    fn_gotoUnit() {
        const partyID = this.fn_getCurrentPartyID();
        if (partyID) {
            fn_gotoUnit_byPartyID(partyID);
        }
    }

    fn_getCurrentPartyID() {
        throw new Error('fn_getCurrentPartyID must be implemented by subclass');
    }

    fn_toggleMinimize() {
        this.setState(prevState => ({ isMinimized: !prevState.isMinimized }));
    }

    fn_closeDialog() {
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_renderDialogHeader(p_title, showGotoButton = true) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        const hasValidPartyID = this.fn_getCurrentPartyID() !== null;
        
        return (
            <div className="card-header bg-warning text-dark js-draggable-handle">
                <strong>{p_title}</strong>
                <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_closeDialog()}>
                    {js_globals.DIALOG_ICONS.CLOSE}
                </button>
                <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_toggleMinimize()}>
                    {this.state.isMinimized ? js_globals.DIALOG_ICONS.MAXIMIZE : js_globals.DIALOG_ICONS.MINIMIZE}
                </button>
                <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_opacityDialog()}>
                    {this.state.opaque_clicked ? js_globals.DIALOG_ICONS.OPAQUE : js_globals.DIALOG_ICONS.TRANSPARENT}
                </button>
                {showGotoButton && hasValidPartyID && (
                    <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_gotoUnit()}>
                        {js_globals.DIALOG_ICONS.GOTO}
                    </button>
                )}
            </div>
        );
    }

    fn_renderDialogFooter(extraButtons = null) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        return (
            <div className="text-center">
                <div className="btn-group w-100 d-flex flex-wrap">
                    {extraButtons}
                </div>
            </div>
        );
    }
}

export default ClssDialogBase;
