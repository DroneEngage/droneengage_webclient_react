import React from 'react';
import { withTranslation } from 'react-i18next';
import { fn_gotoUnit_byPartyID } from '../../js/js_main.js';

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

    fn_renderDialogHeader(p_title) {
        return (
            <div className="card-header bg-warning text-dark js-draggable-handle">
                <strong>{p_title}</strong>
                <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_closeDialog()}>
                    &times;
                </button>
                <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_toggleMinimize()}>
                    {this.state.isMinimized ? '▲' : '▼'}
                </button>
                <button type="button" className="btn btn-sm btn-link text-dark float-end p-0 ms-2" onClick={() => this.fn_opacityDialog()}>
                    {this.state.opaque_clicked ? '●' : '○'}
                </button>
            </div>
        );
    }

    fn_renderDialogFooter(extraButtons = null) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        return (
            <div className="text-center">
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

export default ClssDialogBase;
