import React    from 'react';


import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter'
import {js_localStorage} from '../../js/js_localStorage'

export class ClssFireEvent extends React.Component {


    constructor()
      {
            super ();
            this.state = {
              m_update: 0
            };
            this.edit_Ref = React.createRef();
      
      js_eventEmitter.fn_subscribe(js_event.EE_onAdvancedMode,this,this.fn_advancedMode);
    }
  
    componentDidMount () 
    {
      this.state.m_update = 1;
    }

    fn_advancedMode (p_me)
    {
      if (p_me.state.m_update === 0) return ;
      p_me.setState({'m_update': p_me.state.m_update +1});
    }
  
    fn_fireEvent()
    {
        this.props.onClick(this.edit_Ref.current.value)
    }
  
    componentWillUnmount () 
    {
      js_eventEmitter.fn_unsubscribe(js_event.EE_onAdvancedMode,this);
    }
  
    render() {
      if (js_localStorage.fn_getAdvancedOptionsEnabled() !== true)
      {
        return (
                  <div></div>
              )
      }
      else
      {
        return (
          <div className="form-group">
            <label htmlFor="txt_ev" className="user-select-none  form-label text-white "><small>{this.props.label}</small></label>
            <div className="input-group mb-3">
              <input id="txt_ev"  type="number" min={0} max={2000} step="1.0" className="form-control input-sm input-sm txt_margin " placeholder="0" aria-label="0" ref={this.edit_Ref} />
              <button id="btn_ev"  type="button" className="btn btn-success input-sm line-height-0" onClick={ (e) => this.fn_fireEvent()} >Fire</button>
            </div>
          </div>
        );
      }
    }
  }