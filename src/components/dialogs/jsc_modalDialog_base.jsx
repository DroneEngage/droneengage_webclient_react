import React from 'react';
import ReactDOM from 'react-dom';
import { fn_gotoUnit_byPartyID } from '../../js/js_main.js';

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

    fn_renderDialogHeader(p_title, p_style = 'bg-warning') {
        return (
            <div className={'modal-header ' + p_style}>
                <h4 id="title" className="modal-title p-1 text-white">
                    <strong>{p_title}</strong>
                </h4>
                <button type="button" className="btn-close" onClick={() => this.fn_closeDialog()} aria-label="Close"></button>
            </div>
        );
    }

    fn_renderDialogFooter(extraButtons = null) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        return (
            <div className="modal-footer">
                <div className="btn-group w-100 d-flex flex-wrap">
                    <button
                        id="btnGoto"
                        type="button"
                        className="btn btn-success"
                        onClick={() => this.fn_gotoUnit()}
                    >
                        {tFunc('goto', 'Goto')}
                    </button>
                    {extraButtons}
                </div>
            </div>
        );
    }
}

export default ClssModalDialogBase;
