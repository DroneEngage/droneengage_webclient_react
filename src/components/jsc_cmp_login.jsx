import React    from 'react';

import {fn_do_modal_confirmation} from '../../js/js_main'
import {js_andruavAuth} from '../../js/js_andruavAuth'

// Registration and Regeneration Control
class Clss_LoginControl extends React.Component {
	constructor()
	{
		super ();
		this.state = {
			is_connected: false,
			btnConnectText: 'Login',
			initialized: false,
		};
	}


    fn_EE_permissionReceived (me,params) {
       
            
            js_localStorage.fn_setEmail($('#txtEmail').val());
            js_localStorage.fn_setAccessCode($('#txtAccessCode').val());
            
            me.setState({'is_connected':true});
   
    }

    fn_EE_permissionBadLogin (me,params) {
    
            me.setState({'is_connected':false});

			gui_alert ('Bad Login', params.msg, 'danger');
    }

	fn_EE_permissionDeleted (me,params)
	{
		js_andruavAuth.fn_retrieveLogin($('#txtEmail').val(),$('#txtAccessCode').val());
	}

	

    fn_clickConnect (e) {
			   
		
		fn_do_modal_confirmation ("<strong>Attention: </strong>Access Code" ,
				"Create New Access Code.<br>You will need to define the new accesscode in ALL your Andruav units.<br> \
				The first access code has FULL CONTROL",function (p_approved) {
					if (p_approved === false) return;
					if (CCaptcha.fn_validCaptcha() === true)
					{
						var v_permission = '0xffffffff';
						js_andruavAuth.fn_generateAccessCode($('#txtEmail').val(), v_permission);
					}
					
				}, "Create", "bg-danger text-white");
		
				CCaptcha.fn_displayCaptcha();
	}

	fn_clickRegenerate (e) {
		fn_do_modal_confirmation ("<strong>Attention: </strong>Access Code" ,
				"Regenerating Access Code.<br>The current one will be invalid if it has the same permissions.<br>It is important that you have already access code before regenerating a new one.<br>Read-Only permission is intended to be used with GCS.",function (p_approved) {
					if (p_approved === false) return;
					if (CCaptcha.fn_validCaptcha() === true)
					{
						// Get references to the radio buttons
						var chk_fullctrl = document.getElementById("input_fullctrl");
						var chk_readonlyctrl = document.getElementById("input_readonlyctrl");

						// Check which radio button is selected
						var v_permission = 0x0;
						if (chk_fullctrl.checked) {
							v_permission = '0xffffffff';
						} else if (chk_readonlyctrl.checked) {
							v_permission = '0xffff00ff';
						} else {
							v_permission = '0xffffffff';
						}
						
						js_andruavAuth.fn_regenerateAccessCode($('#txtEmail').val(), v_permission);
					}
					
				}, "Create", "bg-danger text-white");
		
				CCaptcha.fn_displayCaptcha();
	}

	  

    componentWillUnmount () {
				//js_eventEmitter.fn_unsubscribe ( EE_permissionReceived,this);
                //js_eventEmitter.fn_unsubscribe ( EE_permissionBadLogin,this);
                //js_eventEmitter.fn_unsubscribe ( EE_permissionDeleted,this);
		}

    componentDidMount () {
	
			 if (this.state.initialized == true) 
			 {
				 return;
			 }

			 this.state.initialized = true;
				 
			$('#txtEmail').val(js_localStorage.fn_getEmail());
		}





	render() {

			var login = "Access Code Generator";
			if (this.state.is_connected == true)
			{
				login += "ed - As " + $('#txtEmail').val();
			}
		return (
      <div>
		<p className="bg-success  text-center"><strong>{login}</strong></p>
        <div id='login_form' >
				<div className="form-group al_l">
					<label htmlFor="txtEmail" id="email">Email</label>
					<input type="email" id="txtEmail" name="txtEmail" className="form-control" defaultValue={js_localStorage.fn_getEmail()}/>
				</div>
        		<br/>
        </div>

				<div className="form-check">
				<input className="form-check-input" type="radio" value="" id="input_fullctrl" name='grp_permission'/>
				<label className="form-check-label" for="myCheckbox">
					Full Control
				</label>
				</div>
				<div className="form-check">
				<input className="form-check-input" type="radio" value="" id="input_readonlyctrl" name='grp_permission'/>
				<label className="form-check-label" for="myCheckbox">
					Read Only
				</label>
				</div>  
				<div  className="row">
				<div className="col-6 al_l">
				<a href="#" id='login_btn' className="btn btn-primary" onClick={ (e) => this.fn_clickConnect(e) }><span className="glyphicon glyphicon-download-alt"  ></span> AccessCode</a>
				</div>
				<div className="col-6 al_l">
				<a className="btn btn-danger" data-bs-toggle="modal" href="#regeneratemodal" onClick={ (e) => this.fn_clickRegenerate(e) }><span className="glyphicon glyphicon-retweet"></span> Regenerate</a>
				</div>
				</div>
      </div>
    );
	}

}






ReactDOM.render(
			<Clss_LoginControl />,
			window.document.getElementById('loginCtrl')
		);

