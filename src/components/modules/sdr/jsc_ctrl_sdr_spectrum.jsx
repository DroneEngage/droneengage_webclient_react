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
import {EVENTS as js_event} from '../../../js/events/js_eventList.js'
import {EventBridge} from '../../../js/hooks/EventBridge.jsx'

import ClassBarChart from '../../gadgets/jsc_ctrl_bar_chart'

class ClassSDRSpectrumVisualizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_update : 0
        };

        this.m_flag_mounted = false;

        // Event subscription is owned by the EventBridge sibling rendered
        // below (useEventSubscription auto-unsubscribes on unmount).
    }

    componentDidMount() {
        this.m_flag_mounted = true;
    }

    componentWillUnmount () {
        this.m_flag_mounted = false;
        // Unsubscription is handled automatically by the EventBridge
        // sibling (useEventSubscription) on unmount.
    }

    fn_unitUpdated (p_me, p_unit)
    {
        if (p_me.m_flag_mounted === false) return;
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
            return (
                <React.Fragment>
                    <EventBridge eventName={js_event.EE_unitSDRSpectrum} onEvent={(p_unit) => this.fn_unitUpdated(this, p_unit)} />
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
                <EventBridge eventName={js_event.EE_unitSDRSpectrum} onEvent={(p_unit) => this.fn_unitUpdated(this, p_unit)} />
                <ClassBarChart data={data} labels={labels} />
            </React.Fragment>
        );
    }
}


export default ClassSDRSpectrumVisualizer;