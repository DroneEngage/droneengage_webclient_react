import React from 'react';
import { js_globals } from '../../../js/js_globals';

export class ClssCtrlGPIO_Port extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gpio_obj: props.gpio_obj,
            m_update: 0,
            pwm_freq_input: props.gpio_obj.pin_value || '' // Track frequency input value
        };

        this.m_pwm_update = false;
        this.key = Math.random().toString();
        this.m_onoff_checkRef = React.createRef();
        this.m_pwm_freqRef = React.createRef();
        this.m_pwm_duty_cycleRef = React.createRef();
    }

    componentDidMount() {
        this.updateRefs(); // Call the helper function
        this.setState({ m_update: 1 });
    }

    componentDidUpdate(prevProps) {

        if (this.m_pwm_update === true)
        {
            this.updateRefs(); // Update refs after state update is complete
            return ;
        }

        if (prevProps.gpio_obj !== this.props.gpio_obj || prevProps.gpio_obj.pwm_width !== this.props.gpio_obj.pwm_width
            && (this.m_pwm_update === false)
        ) {
            this.setState({
                gpio_obj: this.props.gpio_obj,
            }, () => { this.updateRefs(); }); // Update refs after state update is complete
        }


        
    }

    updateRefs = () => {
        if (this.m_onoff_checkRef.current) {
            this.m_onoff_checkRef.current.checked = this.state.gpio_obj.pin_value;
        }
        if (this.m_pwm_duty_cycleRef.current) {
            this.m_pwm_duty_cycleRef.current.value = this.state.gpio_obj.pwm_width;
        }
        if (this.m_pwm_freqRef.current) {
            this.m_pwm_freqRef.current.value = this.state.gpio_obj.pin_value;
        }

        this.m_pwm_update = false;
        
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if the gpio_obj has changed or the frequency input value has changed
        const update = (JSON.stringify(nextProps.gpio_obj) !== JSON.stringify(this.props.gpio_obj))
            || (nextState.gpio_obj.pwm_width !== this.state.gpio_obj.pwm_width)
            || (nextState.pwm_freq_input !== this.state.pwm_freq_input);

        return update;
    }

    fn_onPWMWidthChange(e) {
        const newGpioObj = { ...this.state.gpio_obj, pwm_width: parseInt(e.currentTarget.value) }; // Create a copy!
        this.m_pwm_update = true;
        this.setState({ gpio_obj: newGpioObj });
    }

    fn_onPwmWidthMouseUp(e) {
        const newGpioObj = { ...this.state.gpio_obj, pwm_width: parseInt(e.currentTarget.value) }; // Create a copy!
        this.m_pwm_update = true;
        this.setState({ gpio_obj: newGpioObj });

        // Update unit only when mouse is up to avoid multiple updates when scrolling.
        js_globals.v_andruavClient.API_writeGPIO_PWM(this.props.p_unit, newGpioObj.pin_number, newGpioObj.pin_value, newGpioObj.pwm_width);
    }

    fn_onPWMFrequencyChange(e) {
        const value = e.target.value;
        this.setState({ pwm_freq_input: value }); // Update the frequency input value in state
    }

    fn_onApplyFrequency = () => {
        const newGpioObj = { ...this.state.gpio_obj, pin_value: parseInt(this.state.pwm_freq_input) }; // Create a copy!
        this.setState({ gpio_obj: newGpioObj }, () => {
            js_globals.v_andruavClient.API_writeGPIO_PWM(this.props.p_unit, newGpioObj.pin_number, newGpioObj.pin_value, newGpioObj.pwm_width);
        });
    }

    fn_onPortOnOff(e) {
        const checked = e.currentTarget.checked;
        if (this.props.gpio_obj.pin_mode >= 2) return;

        js_globals.v_andruavClient.API_writeGPIO(this.props.p_unit, this.props.gpio_obj.pin_number, checked ? 1 : 0);
    };

    render() {
        const { pin_number, pin_name, pin_mode, gpio_type, pin_value, pwm_width } = this.state.gpio_obj;
    
        return (
            <div key={'gpio_row_' + this.key} className="row mb-3 ps-3 align-items-center">
                {/* Pin Number and Name */}
                <div className="col-4">
                    <span>{pin_number}</span>
                    {pin_name && (
                        <span className={'text-success'}>
                            &nbsp;(&nbsp;{pin_name}
                            {gpio_type === 1 && (<span className="text-danger"> - system</span>)}
                            {pin_mode === 0 && (<span className="text-warning"> - input</span>)} )
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
                                ref={this.m_onoff_checkRef}
                                onClick={(e) => this.fn_onPortOnOff(e)}
                                disabled={pin_mode === 0}
                            />
                            <label className="form-check-label" htmlFor={"input_output_" + this.key}>
                                Input/Output
                            </label>
                        </div>
                    </div>
                )}
    
                {/* PWM Mode Inputs */}
                {pin_mode === 2 && gpio_type !== 1 && (
                    <div className="col-6">
                        <div className='row align-items-center'>
                            <div className="form-group col-5">
                                <label htmlFor={"frq_" + this.key}>Duty Cycle</label>
                                <input
                                    type="range"
                                    className="form-range"
                                    id={"frq_" + this.key}
                                    name="frq"
                                    ref={this.m_pwm_duty_cycleRef}
                                    value={pwm_width || ''}
                                    min={0}
                                    max={1024}
                                    onChange={(e) => this.fn_onPWMWidthChange(e)}
                                    onMouseUp={(e) => this.fn_onPwmWidthMouseUp(e)}
                                />
                            </div>
                            <div className="form-group col-4">
                                <label htmlFor={"duty_" + this.key}>Frequency</label>
                                <input
                                    type="text"
                                    className="form-control input-xs input-sm"
                                    id={"duty_" + this.key}
                                    name="duty"
                                    ref={this.m_pwm_freqRef}
                                    value={this.state.pwm_freq_input}
                                    onChange={(e) => this.fn_onPWMFrequencyChange(e)}
                                />
                            </div>
                            <div className="form-group col-3">
                                <button
                                    key={'btn_apply' + this.key}
                                    className='btn btn-primary btn-sm w-100 mt-4'
                                    title='apply'
                                    onClick={this.fn_onApplyFrequency}
                                >
                                    apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}