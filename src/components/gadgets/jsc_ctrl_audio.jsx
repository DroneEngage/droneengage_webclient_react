import $ from 'jquery'; 
import React    from 'react';

import {js_globals} from '../../js/js_globals';
import {js_eventEmitter} from '../../js/js_eventEmitter'

export class Clss_CTRL_AUDIO extends React.Component {
    
    constructor()
	{
		super ();
		    this.state = {
                m_update: 0,
                m_currentLanguage: 'en'
                
		};

        this.m_langs = ['en','ar','es','ru']
        

        js_eventEmitter.fn_subscribe(js_globals.EE_BattViewToggle,this,this.fn_toggle_global);
    }


    componentDidMount () 
    {
        this.state.m_update = 1;
    }

    fn_setLanguage(en)
    {
        this.state.m_currentLanguage = en;
        $('#' + this.props.p_unit.partyID + '_aln').text(en);
    }

    fn_textToSpeech (p_andruavUnit)
    {
        var p_text = $('#'+ p_andruavUnit.partyID + 'atxt')[0].value;
        var p_language = this.state.m_currentLanguage;
        var p_pitch = parseInt($('#'+ p_andruavUnit.partyID + 'prng')[0].value);
        var p_volume = parseInt($('#'+ p_andruavUnit.partyID + 'vrng')[0].value);
        js_globals.v_andruavClient.API_soundTextToSpeech (p_andruavUnit, p_text, p_language, p_pitch, p_volume);
    }

    render ()
    {
        var css_txt_channel_ws_offline = ' text-white bg-danger ';
        var v_speech_disabled = false;
        const  v_andruavUnit = this.props.p_unit;
        var v_vol_disabled;
        if (v_andruavUnit.m_isDE === false)
            v_vol_disabled = 'true';
        var v_pitch_disabled;
        if (v_andruavUnit.m_isDE === false)
            v_pitch_disabled = 'true';
        
        var v_language_disabled;
        if (v_andruavUnit.m_isDE === false)
            v_language_disabled = 'true';
        
        return (
        <div key={v_andruavUnit.partyID + "_ctl_audio"} className="">
            <div className="row ">
                <div className="col-6">
                    <div key={v_andruavUnit.partyID + 'audio_111'} className= 'col-12 user-select-none '>
                            <p key={v_andruavUnit.partyID + 'audio_2214'} className={css_txt_channel_ws_offline + ' rounded-3 cursor_hand  al_c'} title ='Set Channel online/offline' onClick={() => this.fn_textToSpeech(v_andruavUnit)}>Speak</p>
                    </div>
                
                    <div key={v_andruavUnit.partyID + 'audio_121'} className= 'col-12 user-select-none h-100 w-100 m-1 pb-1'>
                        <textarea id={v_andruavUnit.partyID + 'atxt'} className="h-75 w-100 m-1" rows="3" placeholder="What's up?" required
                        onKeyDown={(e) => e.stopPropagation()} 
                        onKeyUp={(e) => e.stopPropagation()}></textarea>
                        
                    </div>
                
                </div>
                
            <div className="col-6 d-flex">
                <div className="col-8 col-sm-6">
                    <div className="row ">
                        <div key={v_andruavUnit.partyID + 'audio_211'} className="btn-group">
                        <div  className="btn-group" role="group">
                                <button id={v_andruavUnit.partyID + "_aln"} 
                                    type="button" 
                                    className={"btn  btn-sm dropdown-toggle "} 
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled={v_language_disabled=='true'}>english</button>
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
                        <div key={v_andruavUnit.partyID + 'audio_212'} className= 'col-8 col-sm-6 user-select-none '>
                            <label htmlFor="pitch_range" className="col-sm-4 col-form-label al_r flex" >Pitch</label>
                            <input type="range" min="0" max="100" className="form-range col-sm-4 width_fit ps-5 " id={v_andruavUnit.partyID + 'prng'} disabled={v_pitch_disabled=='true'}  />
                        </div>
                    </div>
                    
                    <div className="row ">
                        <div key={v_andruavUnit.partyID + 'audio_213'} className= 'col-12 col-sm-12 user-select-none '>
                            <label htmlFor="volume_range" className="col-sm-4 col-form-label al_r flex" >Volume</label>
                            <input type="range" min="0" max="100" className="form-range col-sm-4 width_fit ps-5 " id= {v_andruavUnit.partyID + 'vrng'} disabled={v_vol_disabled=='true'}  />
                        </div>  
                    </div>
                </div>
            </div>
            </div>
        </div>
        );
    }
}
