import React from 'react';
import * as js_common from '../../js/js_common.js';

export class ClssGamePadButton extends React.Component {

    constructor ()
    {
        super();

        this.key = Math.random().toString();
    };

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.p_pressed !== nextProps.p_pressed;
    }

    render() {
        if (this.props.function == 'undefined')
        {
            return (
                <div className='hidden'></div>
            )
        }
        const c_color = this.props.p_pressed === true ? this.props.color_active : this.props.color_inactive;
        js_common.fn_console_log("button " + this.props.color_active);
        return (
            <div key={this.key } title={this.props.function}>
                <svg viewBox="-2.2 -2.2 4.4 5.0" width="48" height="48">
                    <circle cx="0" cy="0" r="1.5" fill={c_color} stroke={this.props.color_active} strokeWidth="0.2"></circle>
                    <circle cx="0" cy="0" r="1.0" fill="none" className="button"></circle>
                    <text  dominantBaseline="central" textAnchor="middle" fill={this.props.color_active} x="0" y="0">{this.props.t}</text>
                    <text textAnchor="middle" fill="#CCC" x="0" y="2.5" fontSize="0.04em" fontFamily="monospace">{this.props.title}</text>
                </svg>
            </div>
        );
    }
}