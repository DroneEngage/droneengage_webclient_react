
import React from 'react';

import * as  js_siteConfig from '../js/js_siteConfig'

import ClssLoginControl from './jsc_login.jsx'
import ClssCtrlLayout from './jsc_ctrl_layoutControl.jsx'
import ThemeSwitcher from './jsc_theme_switcher.jsx'
import { ClssLanguageSwitcher } from './gadgets/jsc_language_switcher.jsx'

import { withTranslation } from 'react-i18next';

class ClssHeaderControl extends React.Component {
    constructor() {
        super();
        this.state = {};
    }

    render() {

        const { t } = this.props; // Access t function
        let ctrl = [];
        if (this.props.no_layout_ctrl !== null && this.props.no_layout_ctrl !== undefined) {
            ctrl.push(
                <div key='hdr_ctrl2' className='     css_margin_zero css_padding_zero al_r '>
                </div>
            );
        }
        else {
            if (this.props.no_3dmap !== null && this.props.no_3dmap !== undefined) {
                ctrl.push(
                    <div key='hdr_ctrl2' className='     css_margin_zero css_padding_zero al_r mt-2 '>
                        <ClssCtrlLayout showMap3D={false} />
                    </div>
                );
            }
            else {
                ctrl.push(
                    <div key='hdr_ctrl2' className='     css_margin_zero css_padding_zero al_r mt-2 '>
                        <ClssCtrlLayout />
                    </div>
                );
            }
        }
        if (this.props.no_login !== null && this.props.no_login !== undefined) {
            ctrl.push(
                <div key='hdr_ctrl1' className=' col-2 col-lg-1    css_margin_zero  al_r'>

                </div>
            );
        }
        else {
            ctrl.push(
                <div id='login_button' key='hdr_ctrl1' className='css_margin_zero  al_r d-flex align-items-center'>
                    <ClssLoginControl simple='true' />
                </div>
            );
        }
        return (
            <div id='rowheader' key='ClssHeaderControl' className=' d-flex flex-wrap align-items-center css_padding_zero txt-theme-aware-bg fixed-top ps-3 pe-2'>
                <div className='css_margin_zero css_padding_zero d-flex align-items-center'>
                    <nav className="navbar txt-theme-aware-navbar padding_zero">
                        <a className="navbar-brand fs-3 padding_zero d-flex align-items-center" href=".">
                            <img src="/images/de/DE_logo_w_title.png" width="48" height="48" className="d-inline-block align-top" alt="" />
                            <span className="ms-1 text-truncate d-none d-sm-inline">{js_siteConfig.CONST_TITLE}</span>
                        </a>
                    </nav>
                    <div className="dropdown ms-2">
                        <button className="btn btn-sm btn-secondary dropdown-toggle bi bi-list" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                            <span className="ms-1">{t('header.menu')}</span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-start" style={{minWidth: '180px', maxWidth: '90vw'}}>
                            <li key="Home"><a className="dropdown-item txt-theme-aware" href={js_siteConfig.CONST_HOME_URL}>{t('header.home')}</a></li>
                            <li key="Geo"><a className="dropdown-item txt-theme-aware" id='mapeditor' href="./mapeditor" target='_blank' rel="noopener noreferrer">{t('header.planner')}</a></li>
                            <li key="Mobile"><a className="dropdown-item txt-theme-aware" id='mobile' href="./mobile" target='_blank' rel="noopener noreferrer">{t('header.mobile')}</a></li>
                            <li key="Manual"><a className="dropdown-item txt-theme-aware" href={js_siteConfig.CONST_MANUAL_URL} target='_blank' rel="noopener noreferrer">Wiki</a></li>
                            <li key="FAQ"><a className="dropdown-item txt-theme-aware" href={js_siteConfig.CONST_FAQ_URL} target='_blank' rel="noopener noreferrer">FAQ</a></li>
                            <li key="Contact"><a className="dropdown-item txt-theme-aware" href={js_siteConfig.CONST_CONTACT_URL} target='_blank' rel="noopener noreferrer">{t('header.contact')}</a></li>
                            {js_siteConfig.CONST_ANDRUAV_URL_ENABLE && <li key="AndruavAPK"><a className="dropdown-item text-warning" href={js_siteConfig.CONST_ANDRUAV_URL} target='_blank' rel="noopener noreferrer">AndruavAP APK</a></li>}
                            {js_siteConfig.CONST_ACCOUNT_URL_ENABLE && <li key="Account"><a className="dropdown-item txt-theme-aware" href="./accounts" target='_blank' rel="noopener noreferrer">{t('header.account')}</a></li>}
                            <li key="Lang"><hr className="dropdown-divider" /></li>
                            <li key="LangItem" className="px-3 py-1">
                                <ClssLanguageSwitcher className="w-100" />
                            </li>
                            <li key="Theme"><hr className="dropdown-divider" /></li>
                            <li key="ThemeItem" className="px-3 py-1">
                                <ThemeSwitcher showLabel={true} className="d-inline-block" />
                            </li>
                            
                        </ul>
                    </div>
                </div>
                <div className='d-flex flex-wrap align-items-center ms-auto css_margin_zero css_padding_zero'>
                    {ctrl}
                </div>
            </div>
        );
    }
}



export default withTranslation()(ClssHeaderControl);


