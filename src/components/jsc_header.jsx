
import React from 'react';

import {ClssLoginControl} from './jsc_login.jsx'
import {ClssCTRL_Layout} from './jsc_ctrl_layoutControl.jsx'
import * as  js_siteConfig from '../js/js_siteConfig'


class ClssHeaderControl extends React.Component {
    constructor() {
        super ();
		this.state = {};
    }

    render() {

        var ctrl = [];
        if (this.props.no_layout_ctrl !== null && this.props.no_layout_ctrl !== undefined)
            {
                ctrl.push (
                    <div key='hdr_ctrl2' className='col-9 col-lg-4     css_margin_zero css_padding_zero al_r '>
                </div>
                );
            }
            else
            {
                ctrl.push(
                    <div key='hdr_ctrl2' className='col-9 col-lg-4     css_margin_zero css_padding_zero al_r '>
                    <ClssCTRL_Layout/>     
                </div>
                );
            }
            if (this.props.no_login !== null && this.props.no_login !== undefined)
                {
                    ctrl.push (
                        <div key='hdr_ctrl1' className=' col-2 col-lg-1    css_margin_zero  al_r'>
                            
                        </div>
                    );
                }
                else
                {
                    ctrl.push(
                        <div key='hdr_ctrl1' className=' col-2 col-lg-1    css_margin_zero  al_r'>
                            <ClssLoginControl simple='true'/>
                        </div>
                    );
                }
                
            return (
            <div key='ClssHeaderControl' className = 'row  css_padding_zero bg-dark fixed-top ps-3'>
                <div className = 'col-7  css_margin_zero css_padding_zero d-lg-block d-none d-xl-block'>
                    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                        <a className="navbar-brand fs-3" href=".">
                            <img src="./images/de/DE_logo_w_title.png" width="48" height="48" className="d-inline-block align-top" alt="" />
                            {js_siteConfig.CONST_TITLE}
                        </a>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav">
                                <li key="Home" className="nav-item active">
                                    <a className="nav-link" href={js_siteConfig.CONST_HOME_URL}>Home </a>
                                </li>
                                <li key="Geo" className="nav-item">
                                    <a className="nav-link" id='mapeditor' href="./mapeditor.html" target='_blank' rel="noopener noreferrer">Geo Fence</a>
                                </li>
                                <li key="Manual" className="nav-item">
                                    <a className="nav-link" href={js_siteConfig.CONST_MANUAL_URL} target='_blank' rel="noopener noreferrer" >Manual</a>
                                </li>
                                <li key="FAQ" className="nav-item">
                                    <a className="nav-link" href={js_siteConfig.CONST_FAQ_URL} target='_blank' rel="noopener noreferrer">FAQ</a>
                                </li>
                                <li key="Contact" className="nav-item">
                                    <a className="nav-link" href={js_siteConfig.CONST_CONTACT_URL} target='_blank' rel="noopener noreferrer">Contact</a>
                                </li>
                                <li key="Account" className="nav-item">
                                    <a className="nav-link" href="accounts.html" target='_blank' rel="noopener noreferrer">Account</a>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>
                {ctrl}
            </div>
        );
    }
}



export default ClssHeaderControl;


