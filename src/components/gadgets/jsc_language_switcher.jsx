import React from 'react';
import { useTranslation } from 'react-i18next';

import {EVENTS as js_event} from '../../js/js_eventList.js'
import { js_eventEmitter } from '../../js/js_eventEmitter'

export const ClssLanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang; // Update HTML lang
    document.title = i18n.t('title'); // Update title if needed
    js_eventEmitter.fn_dispatch(js_event.EE_Language_Changed);
  };

  return (
    <select id='css_language_switcher' className="bg-secondary text-white rounded-1 " onChange={(e) => changeLanguage(e.target.value)} defaultValue={i18n.language}>
      <option value="en">English</option>
      <option value="ru">Русский</option>
      <option value="es">Español</option>
      <option className='rtl' value="ar">عربى</option>
    </select>
  );
};