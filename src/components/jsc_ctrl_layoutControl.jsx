import React from 'react';
import { withTranslation } from 'react-i18next';
import { fn_showSettings, fn_showMap, fn_showMap3D, fn_showVideoMainTab, fn_showControl } from '../js/app/js_main.js';
import { CONST_FEATURE } from '../js/config/js_siteConfig.js';
import { useLayout } from '../js/hooks/useLayout.js';

function ClssCtrlLayout({ showMap3D, t }) {
    const layout = useLayout();

    // Effective mode index (0-based) matching fn_applyControl's switch arithmetic.
    const modeCount = layout.smallMode ? 4 : 6;
    const effectiveMode = ((layout.displayMode % modeCount) + modeCount) % modeCount;
    const v_display_mode = effectiveMode + 1;

    const showMap3DButton = showMap3D !== false && !CONST_FEATURE.DISABLE_3D_MAP && layout.btn.map3d;

    return (
        <div id="main_btn_group" role="group" className="d-flex flex-wrap align-items-center gap-1" >
            <button
                type="button"
                id="btn_showSettings"
                className={`btn btn-success btn-sm  bi bi-gear-fill btn_bi_fixer ${layout.btn.settings ? '' : 'd-none'}`}
                title={t('ctrlLayout:settings.title')}
                onClick={(e) => fn_showSettings()}
            >
                <strong>{t('ctrlLayout:settings.label')}</strong>
            </button>
            <button
                type="button"
                id="btn_showMap"
                className={`btn btn-danger btn-sm  bi bi-map btn_bi_fixer ${layout.btn.map ? '' : 'd-none'}`}
                title={t('ctrlLayout:map.title')}
                onClick={(e) => fn_showMap()}
            >
                <strong>{t('ctrlLayout:map.label')}</strong>
            </button>
            {showMap3DButton && (
                <button
                    type="button"
                    id="btn_showMap3D"
                    className="btn btn-secondary btn-sm bi bi-badge-3d btn_bi_fixer "
                    title={t('ctrlLayout:map3d.title')}
                    onClick={(e) => fn_showMap3D()}
                >
                    <strong>{t('ctrlLayout:map3d.label')}</strong>
                </button>
            )}
            <button
                type="button"
                id="btn_showVideo"
                className={`btn btn-warning btn-sm  bi bi-camera-fill btn_bi_fixer ${layout.btn.video ? '' : 'd-none'}`}
                title={t('ctrlLayout:camera.title')}
                onClick={(e) => fn_showVideoMainTab()}
            >
                <strong>{t('ctrlLayout:camera.label')}</strong>
            </button>
            <button
                type="button"
                id="btn_showControl"
                className="btn btn-primary btn-sm  d-none d-sm-inline bi bi-grid-1x2-fill btn_bi_fixer "
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
        </div>
    );
}

export default withTranslation('ctrlLayout')(ClssCtrlLayout);
