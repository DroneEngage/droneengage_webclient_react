import React    from 'react';


class Clss_GUIMessage extends React.Component {
	constructor()
	{
		super ();
		this.state = {
            m_hidden: true,
            m_title: "",
            m_msg: "",
            m_level: ""
        };
    
        js_eventEmitter.fn_subscribe (js_globals.EE_onGUIMessage, this, this.fn_onMessage);
        js_eventEmitter.fn_subscribe (js_globals.EE_onGUIMessageHide, this, this.fn_onHide);
    
    }


    fn_onMessage (p_me,p_params)
    {
        p_me.state.m_title    = p_params.p_title;
        p_me.state.m_msg      = p_params.p_msg;
        p_me.state.m_level    = p_params.p_level;
        p_me.state.m_hidden   = false;
        p_me.forceUpdate();
    }

    fn_onHide(p_me)
    {
        p_me.state.m_hidden   = true;
        p_me.forceUpdate();
    }

    fn_hide ()
    {
        this.state.m_hidden   = true;
        this.forceUpdate();
    }


    componentWillUnmount () {
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onGUIMessage,this);
        js_eventEmitter.fn_unsubscribe (js_globals.EE_onGUIMessageHide,this);
    }


    render () 
    {
        if (this.state.m_hidden == true) 
        {
            return (
                <div  display="none" >
							
						</div>
            );
        }
        
        else 
        {

        return (
                <div id="alertdiv" className="container-fluid gray_border localcontainer">
							<div id="alert" className={'alert alert-dismissible  alert-' + this.state.m_level}>
                            <button type="button" className="btn-close" onClick={() => this.fn_hide()}></button>
  
                            <h4 className="alert-heading">{this.state.m_title}</h4>
                                
								<p id='msg' className="mb-0" dangerouslySetInnerHTML={{__html: this.state.m_msg}} />
							</div>
						</div>

        );
        }
    }

}


ReactDOM.render(
    <Clss_GUIMessage p_index='0' />,
    window.document.getElementById('guiMessageCtrl')
);

