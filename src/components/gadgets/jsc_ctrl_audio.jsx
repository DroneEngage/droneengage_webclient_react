import React from 'react';

import { js_globals } from '../../js/js_globals';
import { EVENTS as js_event } from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'
import { js_localStorage } from '../../js/js_localStorage'

export class ClssCtrlAUDIO extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_currentLanguage: 'en'

        };

        this.m_flag_mounted = false;

        this.m_langs = ['en', 'ar', 'es', 'ru']

        this.m_textRef = React.createRef();
        this.m_pitchRef = React.createRef();
        this.m_volumeRef = React.createRef();
        this.m_languageRef = React.createRef();
        this.m_smsNumberRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_BattViewToggle, this, this.fn_toggle_global);
    }


    componentDidMount() {
        this.m_flag_mounted = true;
        if (this.m_smsNumberRef.current) {
            this.m_smsNumberRef.current.value = js_localStorage.fn_getSMSPhoneNumber();
        }
    }

    fn_setLanguage(en) {
        this.state.m_currentLanguage = en;
        this.m_languageRef.current.value(en);
    }

    fn_textToSpeech(p_andruavUnit) {
        const p_text = this.m_textRef.current.value;
        const p_language = this.state.m_currentLanguage;
        const p_pitch = parseInt(this.m_pitchRef.current.value);
        const p_volume = parseInt(this.m_volumeRef.current.value);
        js_globals.v_andruavFacade.API_soundTextToSpeech(p_andruavUnit, p_text, p_language, p_pitch, p_volume);
    }

    fn_makeFlash(p_andruavUnit) {
        js_globals.v_andruavFacade.API_makeFlash(p_andruavUnit);
    }

    fn_makeSiren(p_andruavUnit) {
        js_globals.v_andruavFacade.API_makeSiren(p_andruavUnit);
    }

    fn_sendSMS(p_andruavUnit) {
        const p_phoneNumber = this.m_smsNumberRef.current.value;
        js_globals.v_andruavFacade.API_sendSMSLocation(p_andruavUnit, p_phoneNumber);
    }

    fn_saveSMSNumber() {
        js_localStorage.fn_setSMSPhoneNumber(this.m_smsNumberRef.current.value);
    }

    render() {
        let css_txt_channel_ws_offline = ' txt-theme-aware bg-danger ';
        const v_andruavUnit = this.props.p_unit;
        let v_vol_disabled;
        let v_pitch_disabled;
        let v_language_disabled;

        if (v_andruavUnit.fn_getIsDE() === false)
        {
            v_vol_disabled = 'true';
            v_pitch_disabled = 'true';
            v_language_disabled = 'true';
        }

        return (
            <div key={v_andruavUnit.getPartyID() + "_ctl_audio"} className="">
                <div className="row ">
                    <div className="col-6">
                        <div key={v_andruavUnit.getPartyID() + 'audio_111'} className='col-12 user-select-none '>
                            <p key={v_andruavUnit.getPartyID() + 'audio_2214'} className={css_txt_channel_ws_offline + ' rounded-3 cursor_hand  al_c'} title='Set Channel online/offline' onClick={() => this.fn_textToSpeech(v_andruavUnit)}>Speak</p>
                        </div>

                        <div key={v_andruavUnit.getPartyID() + 'audio_121'} className='col-12 user-select-none h-100 w-100 m-1 pb-1'>
                            <textarea id={v_andruavUnit.getPartyID() + 'atxt'} ref={this.m_textRef} className="h-75 w-100 m-1" rows="3" placeholder="What's up?" required
                                onKeyDown={(e) => e.stopPropagation()}
                                onKeyUp={(e) => e.stopPropagation()}></textarea>

                        </div>

                    </div>

                    <div className="col-6 d-flex">
                        <div className="col-8 col-sm-6">
                            <div className="row ">
                                <div key={v_andruavUnit.getPartyID() + 'audio_211'} className="btn-group">
                                    <div className="btn-group" role="group">
                                        <button id={v_andruavUnit.getPartyID() + "_aln"} ref={this.m_languageRef}
                                            type="button"
                                            className={"btn  btn-sm dropdown-toggle "}
                                            data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled={v_language_disabled === 'true'}>english</button>
                                        <div className="dropdown-menu" aria-labelledby="btnGroupDrop2">
                                            <a className="dropdown-item " href="#" onClick={() => this.fn_setLanguage('en')}>english</a>
                                            <a className="dropdown-item " href="#" onClick={() => this.fn_setLanguage('ar')}>عربي</a>
                                            <a className="dropdown-item " href="#" onClick={() => this.fn_setLanguage('es')}>español</a>
                                            <a className="dropdown-item " href="#" onClick={() => this.fn_setLanguage('ru')}>Русский</a>
                                            <a className="dropdown-item " href="#" onClick={() => this.fn_setLanguage('ja')}>日本語</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row ">
                                <div key={v_andruavUnit.getPartyID() + 'audio_212'} className='col-8 col-sm-6 user-select-none '>
                                    <label htmlFor={v_andruavUnit.getPartyID() + 'prng'} className="col-sm-4 col-form-label al_r flex" >Pitch</label>
                                    <input type="range" min="0" max="100" className="form-range col-sm-4 width_fit ps-5 " id={v_andruavUnit.getPartyID() + 'prng'} ref={this.m_pitchRef} disabled={v_pitch_disabled === 'true'} />
                                </div>
                            </div>

                            <div className="row ">
                                <div key={v_andruavUnit.getPartyID() + 'audio_213'} className='col-12 col-sm-12 user-select-none '>
                                    <label htmlFor={v_andruavUnit.getPartyID() + 'vrng'} className="col-sm-4 col-form-label al_r flex" >Volume</label>
                                    <input type="range" min="0" max="100" className="form-range col-sm-4 width_fit ps-5 " id={v_andruavUnit.getPartyID() + 'vrng'} ref={this.m_volumeRef} disabled={v_vol_disabled === 'true'} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mt-2">
                    <div className="col-12 d-flex align-items-center gap-2 flex-wrap">
                        <button type="button"
                            className="btn btn-sm btn-warning"
                            title='Toggle Flash'
                            onClick={() => this.fn_makeFlash(v_andruavUnit)}>Flash</button>

                        <button type="button"
                            className="btn btn-sm btn-danger"
                            title='Toggle Siren'
                            onClick={() => this.fn_makeSiren(v_andruavUnit)}>Siren</button>

                        <input type="text"
                            ref={this.m_smsNumberRef}
                            className="form-control form-control-sm"
                            style={{ maxWidth: '180px' }}
                            placeholder="Phone number"
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onChange={() => this.fn_saveSMSNumber()}
                            onBlur={() => this.fn_saveSMSNumber()} />

                        <button type="button"
                            className="btn btn-sm btn-primary"
                            title='Send SMS with GPS location'
                            onClick={() => this.fn_sendSMS(v_andruavUnit)}>Send SMS</button>
                    </div>
                </div>
            </div>
        );
    }
}
