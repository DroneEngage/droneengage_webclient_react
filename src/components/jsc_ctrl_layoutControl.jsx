import React from 'react';
import { withTranslation } from 'react-i18next';
import { js_localStorage } from '../js/js_localStorage';
import { fn_showSettings, fn_showMap, fn_showVideoMainTab, fn_showControl } from '../js/js_main';
import { ClssLanguageSwitcher } from './gadgets/jsc_language_switcher.jsx';

class ClssCtrlLayout extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        js_localStorage.fn_getDisplayMode();
    }

    render() {
        const { t } = this.props; // Access t function with ctrlLayout namespace
        const v_display_mode = js_localStorage.fn_getDisplayMode() % 5 + 1;
        return (
            <div id="main_btn_group" role="group" >
                <button
                    type="button"
                    id="btn_showSettings"
                    className="btn btn-success btn-sm  bi bi-gear-fill"
                    title={t('ctrlLayout:settings.title')}
                    onClick={(e) => fn_showSettings()}
                >
                    <strong>{t('ctrlLayout:settings.label')}</strong>
                </button>
                <button
                    type="button"
                    id="btn_showMap"
                    className="btn btn-danger btn-sm  bi bi-map"
                    title={t('ctrlLayout:map.title')}
                    onClick={(e) => fn_showMap()}
                >
                    <strong>{t('ctrlLayout:map.label')}</strong>
                </button>
                <button
                    type="button"
                    id="btn_showVideo"
                    className="btn btn-warning btn-sm  bi bi-camera-fill"
                    title={t('ctrlLayout:camera.title')}
                    onClick={(e) => fn_showVideoMainTab()}
                >
                    <strong>{t('ctrlLayout:camera.label')}</strong>
                </button>
                <button
                    type="button"
                    id="btn_showControl"
                    className="btn btn-primary btn-sm  d-none d-sm-inline bi bi-grid-1x2-fill"
                    title={t('ctrlLayout:layout.title')}
                    onClick={(e) => fn_showControl(false)}
                >
                    <strong>{t('ctrlLayout:layout.label', { mode: v_display_mode })}</strong>
                </button>
                <button
                    type="button"
                    id="btn_showControl_small"
                    className="btn btn-primary btn-sm d-inline d-sm-none bi bi-grid-1x2-fill"
                    title={t('ctrlLayout:layoutSmall.title')}
                    onClick={(e) => fn_showControl(true)}
                >
                    <strong>{t('ctrlLayout:layoutSmall.label', { mode: v_display_mode })}</strong>
                </button>
                <ClssLanguageSwitcher />
            </div>
        );
    }
}

export default withTranslation('ctrlLayout')(ClssCtrlLayout);