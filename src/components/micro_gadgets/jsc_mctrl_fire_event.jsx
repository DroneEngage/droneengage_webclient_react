import React from 'react';


import { EVENTS as js_event } from '../../js/events/js_eventList.js'
import {EventBridge} from '../../js/hooks/EventBridge.jsx'
import { js_localStorage } from '../../js/state/js_localStorage.js'

export class ClssFireEvent extends React.Component {


  constructor() {
    super();
    this.state = {
      m_update: 0
    };

    this.edit_Ref = React.createRef();

    this.m_flag_mounted = false;

    // Event subscriptions are owned by EventBridge siblings rendered
    // below (see render()), which auto-unsubscribe on unmount via
    // useEventSubscription.
  }

  componentDidMount() {
    this.m_flag_mounted = true;
  }

  fn_advancedMode() {
    if (this.m_flag_mounted === false)return;
    this.setState({ 'm_update': this.state.m_update + 1 });
  }

  fn_fireEvent() {
    this.props.onClick(this.edit_Ref.current.value)
  }

  componentWillUnmount() {
    // Unsubscription is handled automatically by the EventBridge
    // siblings (useEventSubscription) on unmount.
  }

  render() {
    if (js_localStorage.fn_getAdvancedOptionsEnabled() !== true) {
      return (
        <div><EventBridge eventName={js_event.EE_onAdvancedMode} onEvent={() => this.fn_advancedMode()} /></div>
      )
    }
    else {
      return (
        <div className="form-group">
          <EventBridge eventName={js_event.EE_onAdvancedMode} onEvent={() => this.fn_advancedMode()} />
          <label htmlFor="txt_ev" className="user-select-none  form-label txt-theme-aware "><small>{this.props.label}</small></label>
          <div className="input-group mb-3">
            <input id="txt_ev" type="number" min={0} max={2000} step="1.0" className="form-control input-sm input-sm txt_margin " placeholder="0" aria-label="0" ref={this.edit_Ref} />
            <button id="btn_ev" type="button" className="btn btn-success input-sm line-height-0" onClick={(e) => this.fn_fireEvent()} >Fire</button>
          </div>
        </div>
      );
    }
  }
}