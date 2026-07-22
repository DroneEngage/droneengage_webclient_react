import React from 'react';
import ReactDOM from 'react-dom';
import { fn_gotoUnit_byPartyID } from '../../js/js_main.js';
import { js_globals } from '../../js/js_globals.js';

class ClssModalDialogBase extends React.Component {
    constructor(props) {
        super(props);
        this.modalRef = React.createRef();
        this.state = {
            is_open: false,
            m_update: 0,
        };
        this.m_flag_mounted = false;
        this.key = Math.random().toString();
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        this.m_flag_mounted = false;
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
        }
    }

    fn_showDialog() {
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'block';
            this.setState({ is_open: true, m_update: this.state.m_update + 1 });
        }
    }

    fn_hideDialog() {
        if (this.modalRef.current) {
            this.modalRef.current.style.display = 'none';
            this.setState({ is_open: false, m_update: this.state.m_update + 1 });
        }
    }

    fn_closeDialog() {
        this.fn_hideDialog();
    }

    fn_gotoUnit() {
        const partyID = this.fn_getCurrentPartyID();
        if (partyID) {
            fn_gotoUnit_byPartyID(partyID);
        }
    }

    fn_getCurrentPartyID() {
        return null;
    }

    fn_renderInPortal(children) {
        return ReactDOM.createPortal(children, document.body);
    }

    fn_renderDialogHeader(p_title, p_style = 'bg-warning', showGotoButton = true) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        const hasValidPartyID = this.fn_getCurrentPartyID() !== null;
        
        return (
            <div className={'modal-header d-flex justify-content-between align-items-center ' + p_style}>
                <h4 id="title" className="modal-title p-1 text-white m-0">
                    <strong>{p_title}</strong>
                </h4>
                <div className="d-flex align-items-center">
                    {showGotoButton && hasValidPartyID && (
                        <button
                            id="btnGoto"
                            type="button"
                            className="btn btn-sm btn-link text-white p-0 ms-2"
                            onClick={() => this.fn_gotoUnit()}
                        >
                            {js_globals.DIALOG_ICONS.GOTO}
                        </button>
                    )}
                    <button type="button" className="btn btn-sm btn-link text-white p-0 ms-2" onClick={() => this.fn_closeDialog()} aria-label="Close">
                        {js_globals.DIALOG_ICONS.CLOSE}
                    </button>
                </div>
            </div>
        );
    }

    fn_renderDialogFooter(extraButtons = null) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        return (
            <div className="modal-footer">
                <div className="btn-group w-100 d-flex flex-wrap">
                    {extraButtons}
                </div>
            </div>
        );
    }
}

export default ClssModalDialogBase;
