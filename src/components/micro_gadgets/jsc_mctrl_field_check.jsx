
import React from 'react';


/**
 * Properties:
 *      txtLabel
 *      txtValue
 *      required
 * Event:
 *  onChecked (bool)
 *  onValueChange (string)
 */
export class CFieldChecked extends React.Component {


    constructor() {
        super();
        this.state = {
            m_messages: {}
        };

        this.key = Math.random().toString();
        
    }

    componentDidMount() {
        if ((this.props.required === false) || (this.props.required === 'false')) {
            this.m_value.setAttribute('disabled', 'disabled');
            this.m_check.checked = false;
        }
        else {
            this.m_value.removeAttribute('disabled');
            this.m_check.checked = true;
        }
        if (this.props.txtValue !== undefined)
        {
            this.m_value.value = this.props.txtValue;
        }
    }

    componentDidUpdate() {
        if ((this.props.required === false) || (this.props.required === 'false')) {
            this.m_value.setAttribute('disabled', 'disabled');
            this.m_check.checked = false;
        }
        else {
            this.m_value.removeAttribute('disabled');
            this.m_check.checked = true;
        }
        if (this.props.txtValue !== undefined && this.m_value.value !== this.props.txtValue)
        {
            this.m_value.value = this.props.txtValue;
        }
    }

    fn_onTextChange(e) {
        const value = e.target.value;
        
        if (this.props.onValueChange !== null && this.props.onValueChange !== undefined)
        {
            this.props.onValueChange(value);
        }
    }

    fn_onChange(e) {
        // this will contain a reference to the checkbox   
        if (this.m_check.checked) {
            this.m_value.removeAttribute('disabled');
            this.m_check.checked = true;
        } else {
            this.m_value.setAttribute('disabled', 'disabled');
            this.m_check.checked = false;
        }

        if (this.props.onChecked !== null && this.props.onChecked !== undefined)
        {
            this.props.onChecked (this.m_check.checked);
        }
    }


    fn_getValue() {
        if (this.m_check.checked === false) {
            return null;
        }


        return this.m_value.value;
    }

    render() {

        return (
            <div id={this.key} className="input-group input-group-sm">
                {/* <label id={'lbl' + this.key} htmlFor={'txt' + this.key} className="form-check-input css_label_waypoint me-2 bg-transparent text-white " >{this.props.txtLabel}</label> */}
                <label id={'lbl' + this.key} htmlFor={'txt' + this.key} className="bg-transparent text-white col-4 " ><small>{this.props.txtLabel}</small></label>
                <input id={'txt' + this.key} className="col-7 form-control input-sm  " type='text' ref={instance => { this.m_value = instance }} onChange={(e) => this.fn_onTextChange(e)} />
                <input id={'chk' + this.key} className="col-1 form-check-input ms-2" type="checkbox" ref={instance => { this.m_check = instance }} onChange={(e) => this.fn_onChange(e)} />
            </div>
        );
    }

}