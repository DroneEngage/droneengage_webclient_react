import React    from 'react';

import * as js_common from '../../js/js_common.js'



export  class ClssGamePadButton extends React.Component {


    shouldComponentUpdate(nextProps, nextState) {
        return this.props.p_pressed != nextProps.p_pressed;
    }


    render()
    {
        const c_color = this.props.p_pressed === true?this.props.color_active:this.props.color_inactive;
        js_common.fn_console_log ("buttion " + this.props.color_active);
        return (
            <div>
                <svg viewBox="-2.2 -2.2 4.4 4.4" width="48" height="48">
                    <circle cx="0" cy="0" r="1.5" fill={c_color} stroke={this.props.color_active} strokeWidth="0.2"></circle>
                    <circle cx="0" cy="0" r="1.0" fill="none"  className="button"></circle>
                    <text className="gp_index" dominantBaseline="central" textAnchor="middle" fill={this.props.color_active} x="0" y="0" title={this.props.title}>{this.props.t}</text>
                </svg>
            </div>
        );
    }
}