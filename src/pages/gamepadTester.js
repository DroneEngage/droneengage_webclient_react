import '../css/bootstrap.min.css';  // my theme

import React , { useEffect } from 'react';


import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssGamepadTester from "../components/jsc_gamepadTester"

const GamePadTesterPage = () => {
     return (
        <div>
		<div id="rowheader" className="row mt-0 me-0 mw-0 mb-5">
			<ClssHeaderControl no_login no_layout_ctrl/>
            </div>
            <div><ClssGamepadTester/> </div>
        <div id="footer_div" className="row mt-0 me-0 mw-0 mb-5">
            <ClssFooterControl />
            </div>
        </div>
            );
  };
  
export default GamePadTesterPage;
  