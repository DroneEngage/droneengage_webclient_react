import React from 'react';
import { withTranslation } from 'react-i18next';

import * as js_siteConfig from '../../js/js_siteConfig.js';
import { EVENTS as js_event } from '../../js/js_eventList.js';
import { js_eventEmitter } from '../../js/js_eventEmitter';

class ClssLanguageSwitcher extends React.Component {
    changeLanguage = (lang) => {
        this.props.i18n.changeLanguage(lang);
        document.documentElement.lang = lang;
        document.title = this.props.i18n.t('title');
        js_eventEmitter.fn_dispatch(js_event.EE_Language_Changed);
    };

    componentDidMount() {
        this.enforceDefaultLanguage();
    }

    componentDidUpdate(prevProps) {
        // Re-enforce if the language prop changed (e.g., default changed externally)
        if (prevProps.i18n.language !== this.props.i18n.language) {
            this.enforceDefaultLanguage();
        }
    }

    enforceDefaultLanguage = () => {
        const enabledLanguages = this.getEnabledLanguages();
        if (enabledLanguages.length === 1) {
            const singleLang = enabledLanguages[0].code;
            if (this.props.i18n.language !== singleLang) {
                this.changeLanguage(singleLang);
            }
        } else {
            // For multiple languages, ensure the current language matches the default if it's enabled
            const defaultLang = js_siteConfig.CONST_LANGUAGE.DEFAULT_LANGUAGE;
            if (defaultLang && this.props.i18n.language !== defaultLang) {
                // Check if default is enabled
                const isDefaultEnabled = enabledLanguages.some(lang => lang.code === defaultLang);
                if (isDefaultEnabled) {
                    this.changeLanguage(defaultLang);
                }
            }
        }
    };

    getEnabledLanguages = () => {
        
        return js_siteConfig.CONST_LANGUAGE.ENABLED_LANGUAGES;
    };

    render() {
        const enabledLanguages = this.getEnabledLanguages();
        if (enabledLanguages.length <= 1) {  // Hide even if 0 (edge case)
            return null;
        }

        const defaultLang = js_siteConfig.CONST_LANGUAGE.DEFAULT_LANGUAGE || enabledLanguages[0]?.code || 'en';

        return (
            <select
                id="css_language_switcher"
                className="bg-secondary text-white rounded-1"
                onChange={(e) => this.changeLanguage(e.target.value)}
                defaultValue={defaultLang}
            >
                {enabledLanguages.map(lang => (
                    <option key={lang.code} value={lang.code} className={lang.className}>
                        {lang.label}
                    </option>
                ))}
            </select>
        );
    }
}

const ClssLanguageSwitcherTranslated = withTranslation()(ClssLanguageSwitcher);

export { ClssLanguageSwitcherTranslated as ClssLanguageSwitcher };