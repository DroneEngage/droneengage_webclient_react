
import React from 'react';

/**
 * Author: Mohammad S. Hefny
 * Email: mohammad.hefny@gmail.com
 * 
 * properties:
 * m_checked: true/false  - as initial state
 * m_disabled: if true then combo is not enabled - as initial state
 * 
 * events:
 * OnChanged (is_enabled, is_checked)
 * 
 */

export class CTriStateChecked extends React.Component {

    constructor() {
        super();
        this.state = {
            m_tri_state: 0, // 0,1,2 [disabled, unchecked, checked]
        };

        this.key = Math.random().toString();
        this.m_enable_Ref = React.createRef();
        this.m_disabled = true;
        this.m_checked = false;
    }

    componentDidMount() {
        if (this.props.checked !== undefined) {
            this.m_checked = this.props.checked;
        }

        if (this.props.disabled !== undefined) {
            this.m_disabled = this.props.disabled;
        }
        if (this.m_disabled === true) {
            this.state.m_tri_state = 0;
        }
        else {
            if (this.m_checked === true) {
                this.state.m_tri_state = 2;
            }
            else {
                this.state.m_tri_state = 1;
            }
        }

        this.fn_apply();
    }

    componentDidUpdate() {
        if (this.props.checked !== undefined) {
            this.m_checked = this.props.checked;
        }

        if (this.props.disabled !== undefined) {
            this.m_disabled = this.props.disabled;
        }
        if (this.m_disabled === true) {
            this.state.m_tri_state = 0;
        }
        else {
            if (this.m_checked === true) {
                this.state.m_tri_state = 2;
            }
            else {
                this.state.m_tri_state = 1;
            }
        }

        this.fn_apply();
    }

    fn_onChanged(e) {
        
        this.state.m_tri_state = (this.state.m_tri_state + 1) % 3;
        this.fn_apply();

        if (this.props.onChange !== undefined)
        {
            this.props.onChange(this.m_disabled, this.m_checked);
        }
    }

    fn_apply() {
        switch (this.state.m_tri_state) {
            case 0:
                this.m_enable_Ref.current.disabled = true;
                this.m_disabled = true;
                break;
            case 1:
                this.m_enable_Ref.current.disabled = false;
                this.m_disabled = false;
                this.m_checked = false;
                this.m_enable_Ref.current.checked = false;
                break;
            case 2:
                this.m_enable_Ref.current.disabled = false;
                this.m_disabled = false;
                this.m_checked = true;
                this.m_enable_Ref.current.checked = true;
                break;
        }
    }

    render() {
        return (
            <div key={'ts_01' + this.key} className={'row css_margin_zero padding_zero ' + this.props.className}>
                <label htmlFor={"ts_02" + this.key} className="col-8 al_l " ><small>{this.props.txtLabel}</small></label>
                <div className="w-auto" onClick={(e) => this.fn_onChanged(e)}>
                    <input className="form-check-input col-4 " type="checkbox" id={"ts_02" + this.key} ref={this.m_enable_Ref} />
                </div>
            </div>
        );
    }

}
