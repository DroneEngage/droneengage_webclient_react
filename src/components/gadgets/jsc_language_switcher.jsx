import React from 'react';
import { useTranslation } from 'react-i18next';

export const ClssLanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang; // Update HTML lang
    document.title = i18n.t('title'); // Update title if needed
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