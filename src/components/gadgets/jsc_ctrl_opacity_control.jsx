import React from 'react';
import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter';

export default class ClssCtrlOpacityControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_opacity: 0.8,
        };

        this.key = Math.random().toString();
        
        // Define the cycle steps
        this.m_opacitySteps = [0.0, 0.4, 0.7, 1.0];
    }

    componentDidMount() {
        // Initialize opacity
        this.fn_emitOpacity(this.state.m_opacity);
    }

    fn_emitOpacity(opacity) {
        js_eventEmitter.fn_dispatch(js_event.EE_Opacity_Control, { opacity: opacity });
    }

    fn_handleClick(e) {
        // Find current index or default to something close
        let currentIndex = -1;
        
        // Find the closest step to current opacity
        let minDiff = 100;
        for (let i = 0; i < this.m_opacitySteps.length; i++) {
            const diff = Math.abs(this.state.m_opacity - this.m_opacitySteps[i]);
            if (diff < minDiff) {
                minDiff = diff;
                currentIndex = i;
            }
        }

        // Next step
        const nextIndex = (currentIndex + 1) % this.m_opacitySteps.length;
        const newOpacity = this.m_opacitySteps[nextIndex];

        this.setState({ m_opacity: newOpacity });
        this.fn_emitOpacity(newOpacity);
    }

    render() {
        let css_icon = "bi bi-lightbulb-fill cursor_hand";
        let title = "Opacity Control";

        // Logic for icon colors and titles based on opacity
        // 1.0: success
        // 0.7: warning
        // 0.4: primary
        // 0.0: secondary/slashed

        // Use a small epsilon for float comparison just in case, though usually exact match works for assigned values
        if (this.state.m_opacity >= 0.95) { // ~1.0
            css_icon = "bi bi-lightbulb-fill txt-theme-aware cursor_hand";
            title = "HUD Visible (100%)";
        } else if (this.state.m_opacity >= 0.65) { // ~0.7
            css_icon = "bi bi-lightbulb-fill txt-theme-aware cursor_hand";
            title = "HUD Visible (70%)";
        } else if (this.state.m_opacity >= 0.35) { // ~0.4
            css_icon = "bi bi-lightbulb-fill text-secondary cursor_hand";
            title = "HUD Visible (40%)";
        } else { // ~0.0
            css_icon = "bi bi-lightbulb-off text-secondary cursor_hand";
            title = "HUD Hidden";
        }

        return (
            <div className="d-flex align-items-center">
                <i 
                    id={this.props.id ? this.props.id : this.key} 
                    key={this.key} 
                    className={css_icon + " css_large_icon"} 
                    title={title}
                    onClick={(e) => this.fn_handleClick(e)}
                ></i>
            </div>
        );
    }
}
