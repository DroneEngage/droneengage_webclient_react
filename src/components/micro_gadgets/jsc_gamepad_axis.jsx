import React    from 'react';
import * as js_common from '../../js/js_common.js'


export  class ClssGamePadAxisControl extends React.Component {

    render()
    {
        return (
            <div >
            <svg viewBox="-2.2 -2.2 4.4 4.4" width="128" height="128">
                <circle cx="0" cy="0" r="2" fill="none" stroke="#888" strokeWidth="0.04"></circle>
                <path d="M0,-2L0,2M-2,0L2,0" stroke="#888" strokeWidth="0.04"></path>
                <circle cx={this.props.x*2} cy={this.props.y*2} r="0.22" fill="red" className="axis"></circle>
                <text textAnchor="middle" fill="#CCC" x="0" y="2">{this.props.x + "," + this.props.y}</text>
            </svg>
            </div>
        );
    }
}

