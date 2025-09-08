import packageJson from  '../../package.json'

import React from 'react';
import { withTranslation } from 'react-i18next';

import * as  js_siteConfig from '../js/js_siteConfig.js';

class ClssFooterControl extends React.Component {
	constructor()
	{
        super ();
		this.state = {};
    }


    render()
    {
        const year = (new Date()).getFullYear();

        return (
            <footer className="text-center bg-4">
  
                <p className="user-select-none  text-white">© Copyright  2014-{year}, <a href={js_siteConfig.CONST_HOME_URL} className="a_nounderline a_hoverinvers"data-bs-toggle="tooltip" title="DroneEngage">{js_siteConfig.CONST_TITLE}</a> <span className="small text-light text-decoration-underline">  build:{packageJson.build_number}</span></p> 
    
            </footer>
        );
    }
}

export default withTranslation()(ClssFooterControl);
