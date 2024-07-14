import {js_globals} from './js_globals.js';
import {js_localStorage} from './js_localStorage'

/***************************************************

	Mohammad Said Hefny
	mohammad.hefny@gmail.com
	30 Jul 2016

*****************************************************/
class CSpeakEngine 
{
	
	constructor () 
	{
		var Me = this;
		
		this._v_enable_speak =  js_localStorage.fn_getSpeechEnabled()===true;
		this._v_speakmsg ='';
		this._v_to_speak = {};
		this._v_index = 0;
		this._v_curIndex = 0;
	
		speechSynthesis.cancel()
		this._v_speakmsg = new SpeechSynthesisUtterance();

		let s = this.fn_setSpeech();
		s.then((voices) => 
		{
			this._v_speakmsg.voice = voices[3]; // Note: some voices don't support altering params
			this._v_speakmsg.voiceURI = 'native';
			this._v_speakmsg.volume = js_localStorage.fn_getVolume() / 100; // 1; // 0 to 1
			this._v_speakmsg.rate = 1; // 0.1 to 10
			this._v_speakmsg.pitch = 1; //0 to 2
			this._v_speakmsg.lang = 'en-US';
		});
		

		var elapsedTime = 0;
		
		this._v_speakmsg.onend = function(e) {
			js_globals.fn_console_log('Finished in ' + elapsedTime + ' seconds.');
			if (Me._v_curIndex < Me._v_index )
			{
				Me._v_speakmsg.text = Me._v_to_speak[Me._v_curIndex];
				delete Me._v_to_speak[Me._v_curIndex];
				Me._v_curIndex = Me._v_curIndex + 1;
				speechSynthesis.speak(Me._v_speakmsg);	
			}
		};
	};
	
	
	static getInstance() {
        if (!CSpeakEngine.instance) {
            CSpeakEngine.instance = new CSpeakEngine();
        }
        return CSpeakEngine.instance;
    }

    fn_setSpeech() {
		//https://stackoverflow.com/questions/49506716/speechsynthesis-getvoices-returns-empty-array-on-windows
		return new Promise(
			function (resolve, reject) {
				let synth = window.speechSynthesis;
				let id;
	
				id = setInterval(() => {
					if (synth.getVoices().length !== 0) {
						resolve(synth.getVoices());
						clearInterval(id);
					}
				}, 10);
			}
		)
	}
	fn_updateSettings()
	{
		this._v_enable_speak = js_localStorage.fn_getSpeechEnabled()===true;
		this._v_speakmsg.volume = js_localStorage.fn_getVolume() / 100; // 1; // 0 to 1
	}

	fn_speak (text)
	{
		if (this._v_enable_speak === false) return ;
		if (this._v_speakmsg === null) return ; // not defined
		if ((text === null) || (text === '')) return ;
		this._v_speakmsg.text = text;
		if (speechSynthesis.speaking === true)
		{
			this._v_to_speak[this._v_index] = text;
			this._v_index = this._v_index + 1;
			return ;
		}
		speechSynthesis.speak(this._v_speakmsg);	
	};
}



export var js_speak = CSpeakEngine.getInstance();
