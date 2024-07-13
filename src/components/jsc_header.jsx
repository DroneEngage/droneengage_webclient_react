import React from 'react';
import ReactDOM from "react-dom/client";

import {CLSS_LoginControl} from './jsc_login.jsx'
import {CLSS_CTRL_Layout} from './jsc_ctrl_layoutControl.jsx'
import * as  js_siteConfig from '../js/js_siteConfig'


class CLSS_HeaderControl extends React.Component {
    constructor() {
        super ();
		this.state = {};
    }

    render() {
        return (
            <div key='CLSS_HeaderControl' className = 'row  css_padding_zero bg-dark fixed-top ps-3'>
                <div className = 'col-7  css_margin_zero css_padding_zero d-lg-block d-none d-xl-block'>
                    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                        <a className="navbar-brand fs-3" href="#">
                            <img src="./images/de/DE_logo_w_title.png" width="48" height="48" className="d-inline-block align-top" alt="" />
                            {js_siteConfig.CONST_TITLE}
                        </a>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav">
                                <li key="Home" className="nav-item active">
                                    <a className="nav-link" href={js_siteConfig.CONST_HOME_URL}>Home </a>
                                </li>
                                <li key="Geo" className="nav-item">
                                    <a className="nav-link" id='mapeditor' href="./mapeditor.html" target='_blank'>Geo Fence</a>
                                </li>
                                <li key="Manual" className="nav-item">
                                    <a className="nav-link" href={js_siteConfig.CONST_MANUAL_URL} target='_blank' >Manual</a>
                                </li>
                                <li key="FAQ" className="nav-item">
                                    <a className="nav-link" href={js_siteConfig.CONST_FAQ_URL} target='_blank' >FAQ</a>
                                </li>
                                <li key="Contact" className="nav-item">
                                    <a className="nav-link" href={js_siteConfig.CONST_CONTACT_URL} target='_blank' >Contact</a>
                                </li>
                                <li key="Account" className="nav-item">
                                    <a className="nav-link" href="accounts.html" target='_blank' >Account</a>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>
                <div className='col-9 col-lg-4     css_margin_zero css_padding_zero al_r '>
                    <CLSS_CTRL_Layout/>     
                </div>
                <div className=' col-2 col-lg-1    css_margin_zero  al_r'>
                    <CLSS_LoginControl simple='true'/>
                </div>
            </div>
        );
    }
}




    if (js_siteConfig.CONST_TEST_MODE === true)
	{
        const root = ReactDOM.createRoot(document.getElementById('header_div'));
        root.render(<React.StrictMode><CLSS_HeaderControl /></React.StrictMode>);
    
    }
    else
    {
        const root = ReactDOM.createRoot(document.getElementById('header_div'));
        root.render(<CLSS_HeaderControl />);
    }

