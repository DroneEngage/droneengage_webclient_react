import React from 'react';

import {js_globals} from '../../../js/js_globals';

export class ClssCtrlGPIO_Port extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gpio_obj: props.gpio_obj,
        };

        this.key = Math.random().toString();
        this.activeCheckboxOnOffRef = React.createRef();
    }

    componentDidMount() {
        
        if (this.activeCheckboxOnOffRef.current)
            this.activeCheckboxOnOffRef.current.checked = this.state.gpio_obj.pin_value;
        
    }

    componentDidUpdate() {
        this.state = {
            gpio_obj: this.props.gpio_obj,
        };

        if (this.activeCheckboxOnOffRef.current)
            this.activeCheckboxOnOffRef.current.checked = this.props.gpio_obj.pin_value;
        
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if the gpio_obj has changed
        const update = JSON.stringify(nextProps.gpio_obj) !== JSON.stringify(this.props.gpio_obj);

        return  update;
    }

    

    fn_onPinValueChange = (e) => {
        const { name, value } = e.target;
        this.setState({ pin_value: { ...this.state.pin_value, [name]: value } });
        if (this.props.onPinValueChange) {
            this.props.onPinValueChange(this.state.pin_value);
        }
    };

    fn_onPortOnOff (e)
    {
        const checked = e.currentTarget.checked;
        if (this.props.gpio_obj.pin_mode >= 2) return;

        js_globals.v_andruavClient.API_writeGPIO(this.props.p_unit, this.props.gpio_obj.pin_number, checked?1:0);
    };

    render() {
        const { pin_number, pin_name, pin_mode, gpio_type, pin_value } = this.props.gpio_obj;
    
        return (
            <div key={'gpio_row_' + this.key} className="row mb-3">
                {/* Pin Number and Name */}
                <div className="col-6">
                    <span>{pin_number}</span>
                    {pin_name && (
                        <span className={'text-success'}>
                            &nbsp;(&nbsp;{pin_name}
                            {gpio_type !== 1 && <span className="text-danger"> - system</span>} )
                        </span>
                    )}
                </div>
    
                {/* Input/Output Mode Checkbox */}
                {pin_mode < 2 && gpio_type !== 1 && (
                    <div className="col-3">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id={"input_output_" + this.key}
                                ref={this.activeCheckboxOnOffRef}
                                onClick={(e) => this.fn_onPortOnOff(e)}
                            />
                            <label className="form-check-label" htmlFor={"input_output_" + this.key}>
                                Input/Output
                            </label>
                        </div>
                    </div>
                )}
    
                {/* PWM Mode Inputs */}
                {pin_mode === 2 && gpio_type !== 1 && (
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor={"frq_" + this.key}>Frequency</label>
                            <input
                                type="text"
                                className="form-control"
                                id={"frq_" + this.key}
                                name="frq"
                                value={pin_value.frq || ''}
                                onChange={this.fn_onPinValueChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={"duty_" + this.key}>Duty Cycle</label>
                            <input
                                type="text"
                                className="form-control"
                                id={"duty_" + this.key}
                                name="duty"
                                value={pin_value.duty || ''}
                                onChange={this.fn_onPinValueChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }
}