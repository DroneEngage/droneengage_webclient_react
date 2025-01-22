import * as js_common from './js_common.js';
import {js_localStorage} from './js_localStorage';

/***************************************************

	Mohammad Said Hefny
	mohammad.hefny@gmail.com
	30 Jul 2016

*****************************************************/

class CSpeakEngine {
    constructor() {
        
		if (!window.speechSynthesis) {
            console.error('Web Speech API is not supported in this browser.');
            return;
        }

        this._v_enable_speak = js_localStorage.fn_getSpeechEnabled() === true;
        this._v_speakmsg = new SpeechSynthesisUtterance();
        this._v_to_speak = [];
        this._v_index = 0;
        this._v_curIndex = 0;

        this._initializeSpeech();
    }

    static getInstance() {
        if (!CSpeakEngine.instance) {
            CSpeakEngine.instance = new CSpeakEngine();
        }
        return CSpeakEngine.instance;
    }

    async _initializeSpeech() {
        try {
            const voices = await this.fn_setSpeech();
            this._v_speakmsg.voice = voices.find(voice => voice.lang === 'en-US') || voices[0]; // Default to first voice if no English voice is found
            this._v_speakmsg.voiceURI = 'native';
            this._v_speakmsg.volume = this._validateVolume(js_localStorage.fn_getVolume() / 100); // Ensure volume is between 0 and 1
            this._v_speakmsg.rate = 1; // 0.1 to 10
            this._v_speakmsg.pitch = 1; // 0 to 2
            this._v_speakmsg.lang = 'en-US';

            this._v_speakmsg.onend = () => this._onSpeechEnd();
            this._v_speakmsg.onerror = (e) => this._onSpeechError(e);
        } catch (error) {
            console.error('Failed to initialize speech synthesis:', error);
        }
    }

    fn_setSpeech() {
        return new Promise((resolve, reject) => {
            const synth = window.speechSynthesis;
            const id = setInterval(() => {
                const voices = synth.getVoices();
                if (voices.length > 0) {
                    clearInterval(id);
                    resolve(voices);
                }
            }, 10);
        });
    }

    fn_updateSettings() {
        this._v_enable_speak = js_localStorage.fn_getSpeechEnabled() === true;
        this._v_speakmsg.volume = this._validateVolume(js_localStorage.fn_getVolume() / 100);
    }

    fn_speak(text) {
        if (!this._v_enable_speak || !text?.trim()) return;

        if (speechSynthesis.speaking) {
            this._v_to_speak.push(text); // Add to queue
            return;
        }

        this._v_speakmsg.text = text;
        speechSynthesis.speak(this._v_speakmsg);
    }

    _onSpeechEnd() {
        js_common.fn_console_log('Finished speaking.');
        if (this._v_to_speak.length > 0) {
            const nextText = this._v_to_speak.shift(); // Get next text from queue
            this._v_speakmsg.text = nextText;
            speechSynthesis.speak(this._v_speakmsg);
        }
    }

    _onSpeechError(event) {
        console.error('Speech synthesis error:', event.error);
        this._v_to_speak = []; // Clear queue on error
    }

    _validateVolume(volume) {
        return Math.min(Math.max(volume, 0), 1); // Ensure volume is between 0 and 1
    }
}

export const js_speak = CSpeakEngine.getInstance();