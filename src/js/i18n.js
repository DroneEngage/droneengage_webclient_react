import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files (create these based on your HTML example)

import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';
import ruTranslation from '../locales/ru/translation.json';
import arTranslation from '../locales/ar/translation.json';

import enUnitBar from '../locales/en/unitBar.json';
import esUnitBar from '../locales/es/unitBar.json';
import ruUnitBar from '../locales/ru/unitBar.json';
import arUnitBar from '../locales/ar/unitBar.json';

import enHome from '../locales/en/home_js.json';
import esHome from '../locales/es/home_js.json';
import ruHome from '../locales/ru/home_js.json';
import arHome from '../locales/ar/home_js.json';



import en_jsc_ctrlLayoutControl from '../locales/en/jsc_ctrlLayoutControl.json';
import es_jsc_ctrlLayoutControl from '../locales/es/jsc_ctrlLayoutControl.json';
import ru_jsc_ctrlLayoutControl from '../locales/ru/jsc_ctrlLayoutControl.json';
import ar_jsc_ctrlLayoutControl from '../locales/ar/jsc_ctrlLayoutControl.json';


i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: { 
        translation: enTranslation,
        unitBar: enUnitBar,
        home: enHome,
        ctrlLayout: en_jsc_ctrlLayoutControl
      },
      es: { 
        translation: esTranslation,
        unitBar: esUnitBar,
        home: esHome,
        ctrlLayout: es_jsc_ctrlLayoutControl
      },
      ar: { 
        translation: arTranslation,
        unitBar: arUnitBar,
        home: arHome,
        ctrlLayout: ar_jsc_ctrlLayoutControl
      },
      ru: { 
        translation: ruTranslation,
        unitBar: ruUnitBar,
        home: ruHome,
        ctrlLayout: ru_jsc_ctrlLayoutControl
      },
    },
    fallbackLng: 'en', // Default to English
    interpolation: { escapeValue: false }, // React handles escaping
    detection: { 
      order: ['localStorage', 'navigator'], // Persist in localStorage, detect from browser
      caches: ['localStorage'], 
    },
  });

export default i18n;