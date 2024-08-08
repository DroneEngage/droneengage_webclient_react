import React , { useEffect } from 'react';


import ClassBarChart from '../components/gadgets/jsc_ctrl_bar_chart'



const Test = () => {

	useEffect(() => {
		   
	}
	);
  
    const data = [50, 75, 120, 90, 80,50, 75, 120, 90, 80,50, 75, 120, 90, 80];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];


  	return (
    <div id='myChart'>
        <ClassBarChart data={data} labels={labels} />
    </div>
    )
  };
  
  export default Test;
  