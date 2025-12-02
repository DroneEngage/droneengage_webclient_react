import '../css/bootstrap.min.css'; 
import '../css/bootstrap-icons/font/bootstrap-icons.css'
import '../css/css_styles.css';
import '../css/css_styles2.css';
import '../css/css_gamepad.css';

import React , { useEffect } from 'react';


import ClssHeaderControl from '../components/jsc_header'
import ClssFooterControl from '../components/jsc_footer'
import ClssGamepadTester from "../components/gamepad/jsc_gamepadTester"

import {fn_on_ready} from '../js/gamepad/js_gamepad_tester'

const GamePadTesterPage = () => {
    useEffect(() => {
        fn_on_ready();
        });
       
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
  