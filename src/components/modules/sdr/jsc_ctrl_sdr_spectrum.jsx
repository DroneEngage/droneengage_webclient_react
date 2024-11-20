/*************************************************************************************
 * 
 *   A N D R U A V - C L I E N T       JAVASCRIPT  LIB
 * 
 *   Author: Mohammad S. Hefny
 * 
 *   Date:   07 Aug 2024
 * 
 * 
 *************************************************************************************/


import React from 'react';
import {js_globals} from '../../../js/js_globals.js';
import {js_eventEmitter} from '../../../js/js_eventEmitter.js'

import ClassBarChart from '../../gadgets/jsc_ctrl_bar_chart'

class ClassSDRSpectrumVisualizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update : 0
        };

        js_eventEmitter.fn_subscribe (js_globals.EE_unitSDRSpectrum,this,this.fn_unitUpdated);
    
    }

    fn_unitUpdated (p_me, p_unit)
    {
        //p_me.fn_copyData(p_me, p_unit);
        p_me.setState({m_update:p_me.state.m_update});
    }

    render()
    {
        let data = [];
        let labels = [];
        let spectrum = this.props.p_unit.m_SDR.getLastSpectrum();
        
        if (spectrum===null || spectrum === undefined)
        {
            return (<div>No Spectrum Data</div>);
        }
        
        data = spectrum.spectrum_data;
        
        labels.push(spectrum.frequency_min);
        labels.push(spectrum.frequency_min + (spectrum.frequency_step * data.length/2));
        labels.push(spectrum.frequency_min + spectrum.frequency_step * data.length);
        
        return (
            <ClassBarChart data={data} labels={labels} />
        );
    }
}


export default ClassSDRSpectrumVisualizer;