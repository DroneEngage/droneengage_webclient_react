import React from 'react';
import { js_globals } from '../../js/js_globals.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter';

/**
 * Opacity Control Component
 * 
 * This component provides a clickable control that cycles through predefined opacity levels
 * for the HUD (Heads-Up Display) elements in the Andruav web client. It allows users to
 * adjust the visibility/transparency of overlay elements.
 * 
 * Features:
 * - Cycles through 4 opacity levels: 0% (hidden), 40%, 70%, 100% (fully visible)
 * - Uses Bootstrap lightbulb icons with different visual states
 * - Emits opacity changes via the global event system
 * - Updates icon appearance and tooltip based on current opacity level
 * 
 * Usage: Click the lightbulb icon to cycle through opacity levels
 */
export default class ClssCtrlOpacityControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            m_opacity: 0.8,  // Default opacity level (80%)
        };

        this.key = Math.random().toString();  // Unique key for React rendering
        
        // Define the opacity cycle steps in order: hidden -> low -> medium -> full
        this.m_opacitySteps = [0.0, 0.4, 0.7, 1.0];
    }

    componentDidMount() {
        // Initialize and emit the default opacity level when component mounts
        this.fn_emitOpacity(this.state.m_opacity);
    }

    /**
     * Emits the current opacity value through the global event system
     * @param {number} opacity - The opacity value (0.0 to 1.0)
     */
    fn_emitOpacity(opacity) {
        js_eventEmitter.fn_dispatch(js_event.EE_Opacity_Control, { opacity: opacity });
    }

    /**
     * Handles click events to cycle through opacity levels
     * Finds the current opacity level and advances to the next one in the cycle
     * @param {Event} e - Click event object
     */
    fn_handleClick(e) {
        // Find the index of the current opacity level in our steps array
        let currentIndex = -1;
        
        // Find the closest step to current opacity by calculating minimum difference
        let minDiff = 100;
        for (let i = 0; i < this.m_opacitySteps.length; i++) {
            const diff = Math.abs(this.state.m_opacity - this.m_opacitySteps[i]);
            if (diff < minDiff) {
                minDiff = diff;
                currentIndex = i;
            }
        }

        // Calculate the next index in the cycle (wraps around to 0 when at end)
        const nextIndex = (currentIndex + 1) % this.m_opacitySteps.length;
        const newOpacity = this.m_opacitySteps[nextIndex];

        // Update state and emit the new opacity value
        this.setState({ m_opacity: newOpacity });
        this.fn_emitOpacity(newOpacity);
    }

    render() {
        let css_icon = "bi bi-lightbulb-fill cursor_hand";
        let title = "Opacity Control";

        // Determine icon appearance and tooltip based on current opacity level
        // Opacity levels and their corresponding visual states:
        // 1.0: Full visibility - bright icon, "HUD Visible (100%)"
        // 0.7: High visibility - bright icon, "HUD Visible (70%)"
        // 0.4: Low visibility - dimmed icon, "HUD Visible (40%)"
        // 0.0: Hidden - off icon, "HUD Hidden"

        // Use range comparisons with small buffers to handle floating point precision
        if (this.state.m_opacity >= 0.95) { // ~1.0 - Full opacity
            css_icon = "bi bi-lightbulb-fill txt-theme-aware cursor_hand";
            title = "HUD Visible (100%)";
        } else if (this.state.m_opacity >= 0.65) { // ~0.7 - High opacity
            css_icon = "bi bi-lightbulb-fill txt-theme-aware cursor_hand";
            title = "HUD Visible (70%)";
        } else if (this.state.m_opacity >= 0.35) { // ~0.4 - Low opacity
            css_icon = "bi bi-lightbulb-fill text-secondary cursor_hand";
            title = "HUD Visible (40%)";
        } else { // ~0.0 - Hidden
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
