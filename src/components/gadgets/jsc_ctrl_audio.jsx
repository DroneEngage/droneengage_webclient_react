import React from 'react';

import { js_globals } from '../../js/js_globals';
import { EVENTS as js_event } from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'

export class ClssCtrlAUDIO extends React.Component {

    constructor() {
        super();
        this.state = {
            m_update: 0,
            m_currentLanguage: 'en'
        };

        this.m_flag_mounted = false;

        this.m_langs = ['en', 'ar', 'es', 'ru', 'ja']

        this.m_textRef = React.createRef();
        this.m_pitchRef = React.createRef();
        this.m_volumeRef = React.createRef();
        this.m_languageRef = React.createRef();
        this.m_soundSelectRef = React.createRef();

        js_eventEmitter.fn_subscribe(js_event.EE_BattViewToggle, this, this.fn_toggle_global);
        js_eventEmitter.fn_subscribe(js_event.EE_onSoundListUpdated, this, this.fn_onSoundListUpdated);
    }


    componentDidMount() {
        this.m_flag_mounted = true;
        // Request the sound file library from the unit's sound module so the
        // dropdown can be populated. The request is a RemoteExecute that is
        // forwarded to subscribed modules; non-DE units simply have no module
        // to handle it, so sending unconditionally is safe.
        const v_andruavUnit = this.props.p_unit;
        if (v_andruavUnit && v_andruavUnit.getPartyID && v_andruavUnit.getPartyID()) {
            js_globals.v_andruavFacade.API_requestSoundList(v_andruavUnit, null);
        }
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_BattViewToggle, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onSoundListUpdated, this);
    }

    fn_onSoundListUpdated(p_me, p_unit) {
        // The sound module pushed (or replied with) an updated library. Force a
        // re-render so the dropdown reflects the current p_unit.m_Sound.m_files.
        if (p_me.m_flag_mounted) {
            p_me.setState((prevState) => ({ m_update: prevState.m_update + 1 }));
        }
    }

    fn_setLanguage(en) {
        const langNames = { 'en': 'english', 'ar': 'عربي', 'es': 'español', 'ru': 'Русский', 'ja': '日本語' };
        this.state.m_currentLanguage = en;
        if (this.m_languageRef.current) {
            this.m_languageRef.current.textContent = langNames[en] || en;
        }
    }

    fn_textToSpeech(p_andruavUnit) {
        const p_text = this.m_textRef.current.value;
        const p_language = this.state.m_currentLanguage;
        const p_pitch = parseInt(this.m_pitchRef.current.value);
        const p_volume = parseInt(this.m_volumeRef.current.value);
        js_globals.v_andruavFacade.API_soundTextToSpeech(p_andruavUnit, p_text, p_language, p_pitch, p_volume);
    }

    fn_playFile(p_andruavUnit) {
        const p_file = this.m_soundSelectRef.current ? this.m_soundSelectRef.current.value : '';
        if (p_file === '' || p_file === null || p_file === undefined) return;
        js_globals.v_andruavFacade.API_soundPlayFile(p_andruavUnit, p_file);
    }

    render() {
        let css_txt_channel_ws_offline = ' txt-theme-aware bg-danger ';
        const v_andruavUnit = this.props.p_unit;
        let v_vol_disabled;
        let v_pitch_disabled;
        let v_language_disabled;
        let v_file_disabled;

        if (v_andruavUnit.fn_getIsDE() === false)
        {
            v_vol_disabled = 'true';
            v_pitch_disabled = 'true';
            v_language_disabled = 'true';
            // Play-file is only supported by the DroneEngage sound module, not
            // native Andruav firmware, which only implements text-to-speech.
            v_file_disabled = 'true';
        }
        const id = v_andruavUnit.getPartyID() + "_ctl_audio";
        // Sound file library received from the unit's sound module via
        // CONST_TYPE_AndruavMessage_SOUND_LIST. Each entry: { n: name, f: file_path }.
        const v_soundFiles = (v_andruavUnit.m_Sound && Array.isArray(v_andruavUnit.m_Sound.m_files))
            ? v_andruavUnit.m_Sound.m_files
            : [];
        return (
            <div id={id} key={id} className="ms-1">
                <div className="row ">
                    <div className="col-6">
                        <div key={v_andruavUnit.getPartyID() + 'audio_111'} className='col-12 user-select-none '>
                            <p key={v_andruavUnit.getPartyID() + 'audio_2214'} className={css_txt_channel_ws_offline + ' rounded-3 cursor_hand  al_c'} title='Set Channel online/offline' onClick={() => this.fn_textToSpeech(v_andruavUnit)}>Speak</p>
                        </div>

                        <div key={v_andruavUnit.getPartyID() + 'audio_121'} className='col-12 user-select-none w-100 m-1 pb-1'>
                            <textarea id={v_andruavUnit.getPartyID() + 'atxt'} ref={this.m_textRef} className="w-100 m-1" rows="2" style={{ height: 'auto' }} placeholder="What's up?" required
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

                            <div className="row ">
                                <div key={v_andruavUnit.getPartyID() + 'audio_214'} className='col-12 col-sm-12 user-select-none d-flex'>
                                    <select className="form-select form-select-sm w-100 m-1" id={v_andruavUnit.getPartyID() + 'asnd'} ref={this.m_soundSelectRef} disabled={v_file_disabled === 'true'} defaultValue="">
                                        <option value="" disabled>Select sound...</option>
                                        {v_soundFiles.map((entry, index) => (
                                            <option key={v_andruavUnit.getPartyID() + 'asnd_' + index} value={entry.f}>{entry.n}</option>
                                        ))}
                                    </select>
                                    <p key={v_andruavUnit.getPartyID() + 'audio_2215'} className={css_txt_channel_ws_offline + ' rounded-3 cursor_hand al_c m-1'} title='Play selected sound on the unit' onClick={() => this.fn_playFile(v_andruavUnit)}>Play</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
