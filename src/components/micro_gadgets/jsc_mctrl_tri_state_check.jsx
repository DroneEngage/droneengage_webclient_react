
import React from 'react';

/**
 * 
 * properties:
 * txtLabel
 * checked: true/false  - as initial state
 * disabled: if true then combo is not enabled - as initial state
 * 
 * events:
 * OnChanged (is_enabled, is_checked)
 * 
 */
export class CTriStateChecked extends React.Component {

    constructor(props) {
        super(props);
        
        // Initialize state based on props
        const initialTriState = this.getTriStateFromProps(props);
        
        this.state = {
            m_tri_state: initialTriState,
        };

        this.key = Math.random().toString();
        this.m_enable_Ref = React.createRef();
    }

    getTriStateFromProps(props) {
        const disabled = props.disabled || false;
        const checked = props.checked || false;
        
        if (disabled) {
            return 0; // disabled
        } else if (checked) {
            return 2; // checked
        } else {
            return 1; // unchecked
        }
    }

    getCurrentValues() {
        switch (this.state.m_tri_state) {
            case 0:
                return { disabled: true, checked: false };
            case 1:
                return { disabled: false, checked: false };
            case 2:
                return { disabled: false, checked: true };
            default:
                return { disabled: true, checked: false };
        }
    }

    isDisabled() {
        return this.getCurrentValues().disabled;
    }

    isChecked() {
        return this.getCurrentValues().checked;
    }

    componentDidMount() {
        this.fn_apply();
    }

    componentDidUpdate(prevProps) {
        const newTriState = this.getTriStateFromProps(this.props);
        
        if (prevProps.disabled !== this.props.disabled || prevProps.checked !== this.props.checked) {
            this.setState({ m_tri_state: newTriState }, () => {
                this.fn_apply();
            });
        }
    }

    fn_onChanged(e) {
        const newTriState = (this.state.m_tri_state + 1) % 3;
        this.setState({ m_tri_state: newTriState }, () => {
            this.fn_apply();
            
            if (this.props.onChange) {
                this.props.onChange(this.isDisabled(), this.isChecked());
            }
        });
    }

    fn_apply() {
        if (!this.m_enable_Ref.current) return;
        
        const { disabled, checked } = this.getCurrentValues();
        
        this.m_enable_Ref.current.disabled = disabled;
        this.m_enable_Ref.current.checked = checked;
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
