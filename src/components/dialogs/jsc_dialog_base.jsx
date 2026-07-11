import React from 'react';
import { withTranslation } from 'react-i18next';
import { fn_gotoUnit_byPartyID } from '../../js/js_main.js';

class ClssDialogBase extends React.Component {
    constructor(props) {
        super(props);
        this.modalRef = React.createRef();
        this.opaque_clicked = false;
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
                this.modalRef.current.style.opacity = this.opaque_clicked ? '1.0' : '0.4';
            };
        }
    }

    fn_opacityDialog() {
        if (this.opaque_clicked === true) {
            this.opaque_clicked = false;
        } else {
            this.opaque_clicked = true;
            if (this.modalRef.current) {
                this.modalRef.current.style.opacity = '1.0';
            }
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

    fn_renderDialogFooter(extraButtons = null) {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        return (
            <div className="text-center">
                <div className="btn-group w-100 d-flex flex-wrap">
                    <button
                        id="opaque_btn"
                        type="button"
                        className="btn btn-primary"
                        onClick={() => this.fn_opacityDialog()}
                    >
                        {tFunc('opaque', 'Opaque')}
                    </button>
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
