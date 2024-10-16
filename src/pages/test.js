import React , { useEffect } from 'react';


import {ClassRadar, highlightSection} from '../components/test/jsc_radar';

import {CTriStateChecked} from '../components/micro_gadgets/jsc_mctrl_tri_state_check.jsx'


const Test = () => {

	useEffect(() => {
		   
	}
	);

  const onChanged =((is_enabled, is_checked) =>
  {
    console.log (is_enabled);
  });
  
    
  	return (
    <div>
      <ClassRadar N={8} M={4} />
      <CTriStateChecked  txtLabel='Server Comm'  disabled={true} checked={true}  onChange={(is_enabled, is_checked) => onChanged(is_enabled, is_checked)} />
      </div>
    )
  };
  
  export default Test;
  