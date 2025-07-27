import React from 'react';
import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter'


export default class ClssCtrlVideoFPS extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            actual_fps: 0,
            m_update: 0
        };

        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_globals.EE_onWebRTC_Video_Statistics, this, this.fn_videoStatistics);
    }


    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if the internal m_update state has changed.
        // This effectively ignores prop changes from the parent.
        return nextState.m_update !== this.state.m_update;
    }

    componentDidMount() {
            this.setState({ m_update: 1 });
    }
    
        
    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onWebRTC_Video_Statistics, this);

    }

    fn_videoStatistics(p_me, p_obj) {
        // {'unit':,'fps':, 'rx':bytesReceived}

        p_me.state.m_actual_fps = p_obj.fps ?? p_obj.fps;
        if (p_me.props.p_unit.partyID !== p_obj.unit.partyID) return ;
        
        console.log("m_actual_fps:", p_me.state.m_actual_fps);

        if (p_me.state.m_update === 0) return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }


    render() {

        let css_Track = ' text-white ';                            
        let css_Track_title = this.props.title?this.props.title :'video fps';
        
        if (isNaN(this.state.m_actual_fps))
        {
            css_Track = ' d-none ';
        }
        
        return (
                <i id={this.props.id?this.props.id:this.key} key={this.key} className={css_Track + " css_large_icon " + this.props.className} title={css_Track_title}>{`${this.state.m_actual_fps} fps`}</i>
            );
    }

}
