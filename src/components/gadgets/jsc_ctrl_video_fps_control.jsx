import React from 'react';
import {EVENTS as js_event} from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'


export default class ClssCtrlVideoFPS extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            actual_fps: 0,
            m_update: 0
        };

        this.key = Math.random().toString();

        js_eventEmitter.fn_subscribe(js_event.EE_onWebRTC_Video_Statistics, this, this.fn_videoStatistics);
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
        js_eventEmitter.fn_unsubscribe(js_event.EE_onWebRTC_Video_Statistics, this);

    }

    fn_videoStatistics(p_me, p_obj) {
        // {'unit':,'fps':, 'rx':bytesReceived}

        p_me.state.m_actual_fps = p_obj.fps ?? p_obj.fps;
        if ((p_me.props.p_unit.partyID !== p_obj.unit.partyID) ||
        (p_me.props.track_id !== p_obj.track_id))
        return ;
        
        if (p_me.m_flag_mounted === false)return ;
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
                <i
                id={this.props.id ? this.props.id : this.key}
                key={this.key}
                className={css_Track + " css_large_icon " + this.props.className}
                title={css_Track_title}
                    >
                    {`${this.state.m_actual_fps} `}
                    {this.state.m_update % 2 === 0 ? (
                        <span className="text-success">.</span>
                    ) : (
                        <span className="text-secondary">.</span>
                    )}
                    {` fps`}
                    </i>
            );
    }

}
