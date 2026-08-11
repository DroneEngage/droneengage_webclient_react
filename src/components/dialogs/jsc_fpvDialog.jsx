import 'jquery-ui-dist/jquery-ui.min.js';

import React from 'react';
import Draggable from 'react-draggable';
import { withTranslation } from 'react-i18next';

import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js';
import * as js_common from '../../js/js_common.js';
import { js_globals } from '../../js/js_globals.js';

import ClssDialogBase from './jsc_dialog_base.jsx';

// Fit modes for the FPV image dialog.
//  - FIT_TO_IMAGE : resize the dialog card body to wrap the image at its
//                   natural dimensions (capped to the viewport). The image
//                   is always contained within the body.
//  - FIT_IMAGE_IN : keep the dialog body at a fixed default size and scale
//                   the image to fit inside it. Small images are enlarged,
//                   large images are shrunk (object-fit: contain).
const CONST_FIT_TO_IMAGE = 'fit_to_image';
const CONST_FIT_IMAGE_IN = 'fit_image_in';

// Default body size used in FIT_IMAGE_IN mode and as the initial size.
const CONST_DEFAULT_BODY_WIDTH = 480;
const CONST_DEFAULT_BODY_HEIGHT = 360;

class ClssFpvDialog extends ClssDialogBase {
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            m_update: 0,
            image_src: '/public/images/camera_img.png',
            party_id: null,
            // natural dimensions of the currently loaded image
            img_natural_width: 0,
            img_natural_height: 0,
            // current fit mode
            fit_mode: CONST_FIT_IMAGE_IN,
            // Compact mode: whether the fullscreen overlay is currently shown
            m_visible: false,
            // Current image rotation (0/90/180/270 degrees)
            m_rotation: 0,
        };

        this.m_flag_mounted = false;
        this.key = Math.random().toString();

        this.modal_ctrl_fpv = React.createRef();
        this.bodyRef = React.createRef();
        this.imgRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_displayFpvDialog, this, this.fn_displayDialog);
    }

    componentDidMount() {
        this.modalRef = this.modal_ctrl_fpv;
        super.componentDidMount();
        this.m_flag_mounted = true;
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_displayFpvDialog, this);
        if (this.modal_ctrl_fpv.current) {
            this.modal_ctrl_fpv.current.style.display = 'none';
        }
    }

    fn_displayDialog(p_me, p_params) {
        if (!p_me.m_flag_mounted) return;

        const { image_src, party_id } = p_params || {};
        p_me.setState({
            image_src: image_src || '/public/images/camera_img.png',
            party_id: party_id || null,
            img_natural_width: 0,
            img_natural_height: 0,
            m_update: p_me.state.m_update + 1,
            m_visible: true,
        });

        if (p_me.modal_ctrl_fpv.current) {
            p_me.modal_ctrl_fpv.current.style.display = 'block';
        }
    }

    fn_getCurrentPartyID() {
        return this.state.party_id || null;
    }

    fn_initDialog() {
        if (this.modal_ctrl_fpv.current) {
            this.modal_ctrl_fpv.current.style.display = 'none';
        }
        super.fn_initDialog();
    }

    fn_closeDialog() {
        if (this.modal_ctrl_fpv.current) {
            this.modal_ctrl_fpv.current.style.opacity = '';
            this.modal_ctrl_fpv.current.style.display = 'none';
        }
        this.setState({ m_visible: false });
    }

    fn_onSave() {
        // Save image logic would go here
        js_common.fn_console_log('FPV: save image');
    }

    fn_onGoto() {
        // Goto image location on map would go here
        js_common.fn_console_log('FPV: goto image');
    }

    fn_onImageLoad(e) {
        const img = e.target;
        const natW = img.naturalWidth || 0;
        const natH = img.naturalHeight || 0;
        this.setState({
            img_natural_width: natW,
            img_natural_height: natH,
        });

        // When an image loads, apply the current fit mode so the dialog
        // adapts its aspect ratio immediately.
        if (this.state.fit_mode === CONST_FIT_TO_IMAGE) {
            this.fn_applyFitToImage(natW, natH);
        }
    }

    // Resize the dialog card body to match the image natural dimensions,
    // capped to the available viewport so large images stay on screen.
    fn_applyFitToImage(p_natW, p_natH) {
        if (!this.bodyRef.current) return;

        let w = p_natW || this.state.img_natural_width;
        let h = p_natH || this.state.img_natural_height;
        if (w <= 0 || h <= 0) {
            w = CONST_DEFAULT_BODY_WIDTH;
            h = CONST_DEFAULT_BODY_HEIGHT;
        }

        // When the image is rotated 90/270 degrees, its width and height are
        // swapped visually: the body must be sized so the unrotated dimensions
        // fit within the available viewport after rotation. To guarantee the
        // rotated image never exceeds the screen width (or height), we swap the
        // width/height budgets used for fitting.
        const isRotatedSideways = this.state.m_rotation === 90 || this.state.m_rotation === 270;
        const maxW = isRotatedSideways ? (window.innerHeight - 120) : (window.innerWidth - 40);
        const maxH = isRotatedSideways ? (window.innerWidth - 40) : (window.innerHeight - 120);

        const ratio = w / h;
        if (w > maxW) { w = maxW; h = Math.round(w / ratio); }
        if (h > maxH) { h = maxH; w = Math.round(h * ratio); }

        this.bodyRef.current.style.width = w + 'px';
        this.bodyRef.current.style.height = h + 'px';
    }

    fn_setFitToImage() {
        this.setState({ fit_mode: CONST_FIT_TO_IMAGE });
        this.fn_applyFitToImage();
    }

    fn_rotateImage90() {
        this.setState({
            m_rotation: (this.state.m_rotation + 90) % 360,
        });
    }

    fn_setFitImageIn() {
        // Restore a default fixed body size and let the image scale to fit
        // inside it via object-fit: contain.
        if (this.bodyRef.current) {
            this.bodyRef.current.style.width = CONST_DEFAULT_BODY_WIDTH + 'px';
            this.bodyRef.current.style.height = CONST_DEFAULT_BODY_HEIGHT + 'px';
        }
        this.setState({ fit_mode: CONST_FIT_IMAGE_IN });
    }

    fn_renderFitButtons() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;
        const isFitToImage = this.state.fit_mode === CONST_FIT_TO_IMAGE;
        const isFitImageIn = this.state.fit_mode === CONST_FIT_IMAGE_IN;

        return (
            <>
                <button
                    type="button"
                    title={tFunc('home:modal.image.fit_to_image', 'Fit to image')}
                    className={'btn btn-sm btn-link text-dark float-end p-0 ms-2' + (isFitToImage ? ' fw-bold' : '')}
                    onClick={() => this.fn_setFitToImage()}
                >
                    {tFunc('home:modal.image.fit_to_image', 'Fit')}
                </button>
                <button
                    type="button"
                    title={tFunc('home:modal.image.fit_image_in', 'Fit image in')}
                    className={'btn btn-sm btn-link text-dark float-end p-0 ms-2' + (isFitImageIn ? ' fw-bold' : '')}
                    onClick={() => this.fn_setFitImageIn()}
                >
                    {tFunc('home:modal.image.fit_image_in', 'Contain')}
                </button>
                <button
                    type="button"
                    title={tFunc('home:modal.image.rotate_90', 'Rotate 90°')}
                    className="btn btn-sm btn-link text-dark float-end p-0 ms-2"
                    onClick={() => this.fn_rotateImage90()}
                >
                    {tFunc('home:modal.image.rotate_90', '↻ 90°')}
                </button>
            </>
        );
    }

    render() {
        const { t } = this.props;
        const tFunc = t ? t : (key, defaultValue) => defaultValue || key;

        let unitName = '';
        if (this.state.party_id) {
            const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.party_id);
            if (p_andruavUnit) {
                unitName = p_andruavUnit.m_unitName;
            }
        }

        // The image always uses object-fit: contain so it never exceeds the
        // dialog body. Small images are enlarged, large images are shrunk,
        // and the aspect ratio is always preserved. The transform rotates the
        // image in place without changing its layout box.
        const baseImgStyle = {
            objectFit: 'contain',
            transform: 'rotate(' + this.state.m_rotation + 'deg)',
            transformOrigin: 'center center',
        };

        // Desktop: the image fills the dialog body, which is sized by
        // fn_applyFitToImage or the default fixed size.
        const desktopImgStyle = {
            ...baseImgStyle,
            width: '100%',
            height: '100%',
        };

        // In FIT_TO_IMAGE mode the body width/height are set dynamically by
        // fn_applyFitToImage via the bodyRef. In FIT_IMAGE_IN mode the body
        // uses the fixed default size. We only set the initial inline style
        // here; fn_applyFitToImage overrides it when needed.
        const bodyStyle = {
            width: CONST_DEFAULT_BODY_WIDTH + 'px',
            height: CONST_DEFAULT_BODY_HEIGHT + 'px',
            overflow: 'hidden',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        };

        const titleText = tFunc('home:modal.image.title', 'FPV Image') + (unitName ? ' of ' + unitName : '');

        // Compact mode: render as a fullscreen dark overlay instead of a
        // draggable card. The image is centered and scaled with object-fit:
        // contain so it always fits the screen. The fit buttons are kept but
        // their px-resizing targets bodyRef, which is not attached here, so
        // fn_applyFitToImage's null guard makes them no-ops in this mode.
        const isCompact = this.fn_isCompact();
        if (isCompact) {
            if (!this.state.m_visible) return null;

            // In compact mode the image is constrained to the available screen
            // size using viewport-relative units (vw/vh) so it never exceeds
            // the mobile view, regardless of window resize or the image's
            // natural dimensions. When rotated 90/270, the width and height
            // budgets are swapped so the visual width of the rotated image
            // never exceeds the screen width.
            //   - maxWidth uses ~96vw (leaving 2vw padding each side)
            //   - maxHeight uses ~80vh (leaving room for header/footer)
            const isCompactRotated = this.state.m_rotation === 90 || this.state.m_rotation === 270;
            const compactImgMaxW = isCompactRotated ? '80vh' : '96vw';
            const compactImgMaxH = isCompactRotated ? '96vw' : '80vh';

            return (
                <div className="mobile-fpv-overlay" onClick={() => this.fn_closeDialog()}>
                    <div className="mobile-fpv-overlay-inner" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-fpv-overlay-header">
                            <span>{titleText}</span>
                            <button className="mobile-sheet-close" onClick={() => this.fn_closeDialog()}>
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                        <div className="mobile-fpv-overlay-body">
                            <img
                                id="unitImg"
                                className="img-rounded"
                                alt="camera"
                                src={this.state.image_src}
                                style={{
                                    ...baseImgStyle,
                                    maxWidth: compactImgMaxW,
                                    maxHeight: compactImgMaxH,
                                    width: 'auto',
                                    height: 'auto',
                                }}
                                ref={this.imgRef}
                                onLoad={(e) => this.fn_onImageLoad(e)}
                            />
                        </div>
                        <div className="mobile-fpv-overlay-footer">
                            {this.fn_renderFitButtons()}
                            <button
                                id="unitImg_save"
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => this.fn_onSave()}
                            >
                                {tFunc('home:modal.image.save', 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <Draggable nodeRef={this.modal_ctrl_fpv} handle=".js-draggable-handle" cancel="button, input, textarea, select, option, a">
                <div
                    key={this.key + 'modal_ctrl_fpv'}
                    id="modal_ctrl_fpv"
                    title="FPV Image"
                    className="card css_ontop border-light p-2"
                    ref={this.modal_ctrl_fpv}
                >
                    {this.fn_renderDialogHeader(
                        titleText,
                        true,
                        this.fn_renderFitButtons()
                    )}

                    {!this.state.isMinimized && (
                        <div
                            key="fpv_body"
                            id="fpv-card-body"
                            className="card-body text-center"
                            style={bodyStyle}
                            ref={this.bodyRef}
                        >
                            <img
                                id="unitImg"
                                className="img-rounded"
                                alt="camera"
                                src={this.state.image_src}
                                style={desktopImgStyle}
                                ref={this.imgRef}
                                onLoad={(e) => this.fn_onImageLoad(e)}
                            />
                        </div>
                    )}

                    {this.fn_renderDialogFooter(
                        <button
                            id="unitImg_save"
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => this.fn_onSave()}
                        >
                            {tFunc('home:modal.image.save', 'Save')}
                        </button>
                    )}
                </div>
            </Draggable>
        );
    }
}

export default withTranslation('home')(ClssFpvDialog);
