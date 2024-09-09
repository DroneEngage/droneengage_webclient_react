import React    from 'react';
import * as  js_siteConfig from '../js/siteConfig.js'

class ClssServoUnit extends React.Component {

    render ()
    {
        var btn_min_css = 'btn-success';
        var btn_max_css = 'btn-danger';

        var btn_min_disabled = false;
        var btn_max_disabled = false;

        if ((this.props.prop_value === null || this.props.prop_value  === undefined) || (this.props.prop_partyid === null || this.props.prop_partyid === undefined)) 
        {
            btn_min_css = ' btn-outline-secondary ';
            btn_max_css = ' btn-outline-secondary ';
            btn_min_disabled = true;
            btn_max_disabled = true;
        }
        else
        {
            if (this.props.prop_value < 1500)
            {
                btn_min_css = ' css_servo_selected bg-danger text-white ';
                btn_max_css = ' css_servo_clickable bg-success text-white ';
            }
            else
            {
                btn_min_css = ' css_servo_clickable bg-success text-white ';
                btn_max_css = ' css_servo_selected bg-danger text-white ';
            }
        }

        return (
            <div id='servoblk' className='row  margin_zero ' title={'value: ' + this.props.prop_value} >
            <div className='row  margin_zero small'>
                <div className='row  margin_zero'>
                    <div className='col-12  margin_zero'>
                    <p id={'min'+this.props.prop_channel} className={'label ' + btn_min_css} onClick={ (e) => js_globals.v_andruavClient.API_do_ServoChannel(this.props.prop_partyid, this.props.prop_channel, 0)} >MIN</p>
                    </div>
                </div>
                <div className='row  margin_zero'>
                    <div className='col-12  margin_zero si-09x'>
                    {this.props.prop_name}
                    </div>
                </div>
                <div className='row  margin_zero'>
                    <div className='col-12  margin_zero'>
                    <p id={'min'+this.props.prop_channel} className={'label ' + btn_max_css} onClick={ (e) => js_globals.v_andruavClient.API_do_ServoChannel(this.props.prop_partyid, this.props.prop_channel, 9999)} >MAX</p>
                    </div>
                </div>
            </div>
            </div>
        );
    }
};


class ClssServoControl extends React.Component {
	constructor()
	{
		super ();
		this.state = {
			is_connected: false,
			initialized: false,
            partyID: null
		};
    
        js_eventEmitter.fn_subscribe(js_globals.EE_servoOutputUpdate,this, this.fn_updateData);
        js_eventEmitter.fn_subscribe(js_globals.EE_displayServoForm,this, this.fn_displayForm);
    }
    

    fn_displayForm (p_me, p_partyID)
    {
        p_me.setState({'partyID':p_partyID});
        $('#modal_ctrl_servo').show();
    }

    fn_updateData (p_me, p_andruavUnit)
    {

        p_me.setState ({'partyID':p_andruavUnit.partyID});

    }

    componentWillUnmount ()
    {
        
        js_eventEmitter.fn_unsubscribe(js_globals.EE_servoOutputUpdate,this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_displayServoForm,this);
    }    

    componentDidMount () {
        $('#modal_ctrl_servo').hide();
        $('#modal_ctrl_servo').draggable();
        $('#modal_ctrl_servo').on('mouseover', function () {
            $('#modal_ctrl_servo').css('opacity', '1.0');
        });
        $('#modal_ctrl_servo').on('mouseout', function () {
            const val = $('#modal_ctrl_servo').attr('opacity');
            if (val === null || val === undefined) {
                $('#modal_ctrl_servo').css('opacity', '0.4');
            }
        });
        $('#modal_ctrl_servo').find('#btnclose').on('click', function () {
            $('#modal_ctrl_servo').hide();
            $('#modal_ctrl_servo').attr('opacity', null);
            $('#modal_ctrl_servo').attr('partyID', null);
             
        });
        $('#modal_ctrl_servo').find('#opaque_btn').on('click', function () {
            const val = $('#modal_ctrl_servo').attr('opacity');
            if (val === null || val === undefined) {
                $('#modal_ctrl_servo').attr('opacity', '1.0');
                $('#modal_ctrl_servo').css('opacity', '1.0');
            }
            else {
                $('#modal_ctrl_servo').attr('opacity', null);
            }
        });
        $('#modal_ctrl_servo').find('#btnGoto').on('click', function () {
            fn_gotoUnit_byPartyID($('#modal_ctrl_servo').attr('partyID'));
        });
        $('#modal_ctrl_servo').find('#btnHelp').on('click', function () {
            fn_helpPage({js_siteConfig.CONST_MANUAL_URL});
        });

        
    }

    render() {
        
        var p_andruavUnit = null;
        if (this.state.partyID !== null && this.state.partyID !== undefined)
        {
            p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.state.partyID);
        }

        if (p_andruavUnit === null || p_andruavUnit === undefined)
        {
            return (
                <div id="modal_ctrl_servo" title="SERVO Control" className="localcontainer css_ontop" >
                            <button id="btnclose" type="btnclose" className="close">&times;</button>
                            <h4 id="title" className="modal-title text-primary"></h4>
                            <div id="ctrl_main" className="form-group text-center container modal_dialog_style" >
                            </div>
                    <div id="modal_ctrl_servo_footer" className="form-group text-center localcontainer">
                        <div className = "row">
                            <div className = "col-md-4">
                                <button id="opaque_btn" type="button" className="btn  btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off">opaque</button>
                            </div>    
                            <div className = "col-md-4">
                                <button id="btnGoto" type="button" className="btn  btn-sm btn-success">Goto</button>
                            </div>
                            <div className = "col-md-4">
                                <button id="btnHelp" type="button" className="btn  btn-sm btn-primary">Help</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        else
        {
            const c_partyID = p_andruavUnit.partyID;
            return (
                <div id="modal_ctrl_servo" title="SERVO Control" className="localcontainer css_ontop" prop_partyid={c_partyID}>
                            <button id="btnclose" type="btnclose" className="close">&times;</button>
                            <h4 id="title" className="modal-title text-primary">Servo's of' {p_andruavUnit.m_unitName} </h4>
                            <div id="ctrl_main" className="form-group text-center container modal_dialog_style" >
                            <div className='row'>
                                <div className='col-md-3 margi'>
                                    <ClssServoUnit prop_partyid={c_partyID} prop_channel = '9' prop_value ={p_andruavUnit.m_Servo.m_values.m_servo1} prop_name='Key 1'></ClssServoUnit>
                                </div>
                                <div className='col-md-3'>
                                    <ClssServoUnit prop_partyid={c_partyID} prop_channel = '10' prop_value ={p_andruavUnit.m_Servo.m_values.m_servo2} prop_name='Key 2'></ClssServoUnit>
                                </div>
                                <div className='col-md-3'>
                                    <ClssServoUnit prop_partyid={c_partyID} prop_channel = '11' prop_value ={p_andruavUnit.m_Servo.m_values.m_servo3} prop_name='Key 3'></ClssServoUnit>
                                </div>
                                <div className='col-md-3'>
                                    <ClssServoUnit prop_partyid={c_partyID} prop_channel = '12' prop_value ={p_andruavUnit.m_Servo.m_values.m_servo4} prop_name='Key 4'></ClssServoUnit>
                                </div>
                            </div>
                            </div>
                            <div id="modal_ctrl_servo_footer" className="form-group text-center localcontainer">
                                <div className = "row">
                                    <div className = "col-md-4">
                                        <button id="opaque_btn" type="button" className="btn  btn-sm btn-primary" data-bs-toggle="button" aria-pressed="false" autoComplete="off">opaque</button>
                                    </div>    
                                    <div className = "col-md-4">
                                        <button id="btnGoto" type="button" className="btn  btn-sm btn-success">Goto</button>
                                    </div>
                                    <div className = "col-md-4">
                                        <button id="btnHelp" type="button" className="btn  btn-sm btn-primary">Help</button>
                                    </div>
                                </div>
                            </div>
                        </div>
            );
        }
    }
};

//CODEBLOCK_START
       
ReactDOM.render(
    <ClssServoControl />,
    window.document.getElementById('servoCtrl')
);

//CODEBLOCK_END