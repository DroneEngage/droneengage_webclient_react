import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import * as  js_siteConfig from './siteConfig.js'

class CLSS_FooterControl extends React.Component {
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
  
                <p className="user-select-none  text-white">© Copyright  2014-{year}, <a href={js_siteConfig.CONST_HOME_URL} className="a_nounderline a_hoverinvers"data-toggle="tooltip" title="DroneEngage">{CONST_TITLE}</a> <span className="small text-light text-decoration-underline">  build:{build_number}</span></p> 
    
            </footer>
        );
    }
}



if (js_siteConfig.CONST_TEST_MODE === true)
{
    const root = ReactDOM.createRoot(document.getElementById('footer_div'));
    root.render(<React.StrictMode><CLSS_FooterControl /></React.StrictMode>);
}
else
{
    const root = ReactDOM.createRoot(document.getElementById('footer_div'));
    root.render(<CLSS_FooterControl />);
}
