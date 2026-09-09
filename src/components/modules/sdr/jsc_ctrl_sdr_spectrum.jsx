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
import { subscribeUnitField } from '../../../js/store/unitStore.js';

import ClassBarChart from '../../gadgets/jsc_ctrl_bar_chart'

class ClassSDRSpectrumVisualizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update : 0
        };

        this.m_flag_mounted = false;
        this.m_unsubSpectrum = null;
    }

    componentDidMount() {
        this.m_flag_mounted = true;
        // Field-granular: re-render only when the spectrum array changes,
        // not on every coarse EE_unitSDRSpectrum for the whole unit.
        const partyId = this.props.p_unit?.getPartyID();
        if (partyId) {
            this.m_unsubSpectrum = subscribeUnitField(partyId, 'm_SDR.m_spectrum_data', () => {
                if (this.m_flag_mounted === false) return;
                this.setState({m_update:this.state.m_update});
            });
        }
    }

    componentWillUnmount () {
        this.m_flag_mounted = false;
        if (this.m_unsubSpectrum) {
            this.m_unsubSpectrum();
            this.m_unsubSpectrum = null;
        }
    }

    render()
    {
        let data = [];
        let labels = [];
        let spectrum = this.props.p_unit.m_SDR.getLastSpectrum();

        if (spectrum===null || spectrum === undefined)
        {
            return (
                <React.Fragment>
                    <div>No Spectrum Data</div>
                </React.Fragment>
            );
        }

        data = spectrum.spectrum_data;

        labels.push(spectrum.frequency_min);
        labels.push(spectrum.frequency_min + (spectrum.frequency_step * data.length/2));
        labels.push(spectrum.frequency_min + spectrum.frequency_step * data.length);

        return (
            <React.Fragment>
                <ClassBarChart data={data} labels={labels} />
            </React.Fragment>
        );
    }
}


export default ClassSDRSpectrumVisualizer;