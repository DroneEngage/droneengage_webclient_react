import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files (create these based on your HTML example)

import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';
import ruTranslation from '../locales/ru/translation.json';
import arTranslation from '../locales/ar/translation.json';
import frTranslation from '../locales/fr/translation.json';

import enUnitBar from '../locales/en/unitBar.json';
import esUnitBar from '../locales/es/unitBar.json';
import ruUnitBar from '../locales/ru/unitBar.json';
import arUnitBar from '../locales/ar/unitBar.json';
import frUnitBar from '../locales/fr/unitBar.json';

import enHome from '../locales/en/home_js.json';
import esHome from '../locales/es/home_js.json';
import ruHome from '../locales/ru/home_js.json';
import arHome from '../locales/ar/home_js.json';
import frHome from '../locales/fr/home_js.json';

import en_jsc_unit_control_imu from '../locales/en/jsc_unit_control_imu.json';
import es_jsc_unit_control_imu from '../locales/es/jsc_unit_control_imu.json';
import ru_jsc_unit_control_imu from '../locales/ru/jsc_unit_control_imu.json';
import ar_jsc_unit_control_imu from '../locales/ar/jsc_unit_control_imu.json';
import fr_jsc_unit_control_imu from '../locales/fr/jsc_unit_control_imu.json';

import en_jsc_ctrlLayoutControl from '../locales/en/jsc_ctrlLayoutControl.json';
import es_jsc_ctrlLayoutControl from '../locales/es/jsc_ctrlLayoutControl.json';
import ru_jsc_ctrlLayoutControl from '../locales/ru/jsc_ctrlLayoutControl.json';
import ar_jsc_ctrlLayoutControl from '../locales/ar/jsc_ctrlLayoutControl.json';
import fr_jsc_ctrlLayoutControl from '../locales/fr/jsc_ctrlLayoutControl.json';


import en_jsc_ctrl_udp_proxy_telemetry from '../locales/en/jsc_ctrl_udp_proxy_telemetry.json';
import es_jsc_ctrl_udp_proxy_telemetry from '../locales/es/jsc_ctrl_udp_proxy_telemetry.json';
import ru_jsc_ctrl_udp_proxy_telemetry from '../locales/ru/jsc_ctrl_udp_proxy_telemetry.json';
import ar_jsc_ctrl_udp_proxy_telemetry from '../locales/ar/jsc_ctrl_udp_proxy_telemetry.json';
import fr_jsc_ctrl_udp_proxy_telemetry from '../locales/fr/jsc_ctrl_udp_proxy_telemetry.json';

import en_jsc_ctrl_swarm from '../locales/en/jsc_ctrl_swarm.json';
import es_jsc_ctrl_swarm from '../locales/es/jsc_ctrl_swarm.json';
import ru_jsc_ctrl_swarm from '../locales/ru/jsc_ctrl_swarm.json';
import ar_jsc_ctrl_swarm from '../locales/ar/jsc_ctrl_swarm.json';
import fr_jsc_ctrl_swarm from '../locales/fr/jsc_ctrl_swarm.json';

import en_jsc_global_settings from '../locales/en/jsc_global_settings.json';
import es_jsc_global_settings from '../locales/es/jsc_global_settings.json';
import ru_jsc_global_settings from '../locales/ru/jsc_global_settings.json';
import ar_jsc_global_settings from '../locales/ar/jsc_global_settings.json';
import fr_jsc_global_settings from '../locales/fr/jsc_global_settings.json';

import en_jsc_viewLinkGimbalControl from '../locales/en/jsc_viewLinkGimbalControl.json';
import es_jsc_viewLinkGimbalControl from '../locales/es/jsc_viewLinkGimbalControl.json';
import ru_jsc_viewLinkGimbalControl from '../locales/ru/jsc_viewLinkGimbalControl.json';
import ar_jsc_viewLinkGimbalControl from '../locales/ar/jsc_viewLinkGimbalControl.json';
import fr_jsc_viewLinkGimbalControl from '../locales/fr/jsc_viewLinkGimbalControl.json';

import en_jsc_ctrl_tracker_ai_list from '../locales/en/jsc_ctrl_tracker_ai_list.json';
import es_jsc_ctrl_tracker_ai_list from '../locales/es/jsc_ctrl_tracker_ai_list.json';
import ru_jsc_ctrl_tracker_ai_list from '../locales/ru/jsc_ctrl_tracker_ai_list.json';
import ar_jsc_ctrl_tracker_ai_list from '../locales/ar/jsc_ctrl_tracker_ai_list.json';
import fr_jsc_ctrl_tracker_ai_list from '../locales/fr/jsc_ctrl_tracker_ai_list.json';


i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: {
        translation: enTranslation,
        unitBar: enUnitBar,
        home: enHome,
        ctrlLayout: en_jsc_ctrlLayoutControl,
        unit_control_imu: en_jsc_unit_control_imu,
        udpProxyTelemetry: en_jsc_ctrl_udp_proxy_telemetry,
        swarmCtrl: en_jsc_ctrl_swarm,
        globalSettings: en_jsc_global_settings,
        viewLinkGimbalControl: en_jsc_viewLinkGimbalControl,
        trackerAIList: en_jsc_ctrl_tracker_ai_list
      },
      es: {
        translation: esTranslation,
        unitBar: esUnitBar,
        home: esHome,
        ctrlLayout: es_jsc_ctrlLayoutControl,
        unit_control_imu: es_jsc_unit_control_imu,
        udpProxyTelemetry: es_jsc_ctrl_udp_proxy_telemetry,
        swarmCtrl: es_jsc_ctrl_swarm,
        globalSettings: es_jsc_global_settings,
        viewLinkGimbalControl: es_jsc_viewLinkGimbalControl,
        trackerAIList: es_jsc_ctrl_tracker_ai_list
      },
      ar: {
        translation: arTranslation,
        unitBar: arUnitBar,
        home: arHome,
        ctrlLayout: ar_jsc_ctrlLayoutControl,
        unit_control_imu: ar_jsc_unit_control_imu,
        udpProxyTelemetry: ar_jsc_ctrl_udp_proxy_telemetry,
        swarmCtrl: ar_jsc_ctrl_swarm,
        globalSettings: ar_jsc_global_settings,
        viewLinkGimbalControl: ar_jsc_viewLinkGimbalControl,
        trackerAIList: ar_jsc_ctrl_tracker_ai_list
      },
      fr: {
        translation: frTranslation,
        unitBar: frUnitBar,
        home: frHome,
        ctrlLayout: fr_jsc_ctrlLayoutControl,
        unit_control_imu: fr_jsc_unit_control_imu,
        udpProxyTelemetry: fr_jsc_ctrl_udp_proxy_telemetry,
        swarmCtrl: fr_jsc_ctrl_swarm,
        globalSettings: fr_jsc_global_settings,
        viewLinkGimbalControl: fr_jsc_viewLinkGimbalControl,
        trackerAIList: fr_jsc_ctrl_tracker_ai_list
      },
      ru: {
        translation: ruTranslation,
        unitBar: ruUnitBar,
        home: ruHome,
        ctrlLayout: ru_jsc_ctrlLayoutControl,
        unit_control_imu: ru_jsc_unit_control_imu,
        udpProxyTelemetry: ru_jsc_ctrl_udp_proxy_telemetry,
        swarmCtrl: ru_jsc_ctrl_swarm,
        globalSettings: ru_jsc_global_settings,
        viewLinkGimbalControl: ru_jsc_viewLinkGimbalControl,
        trackerAIList: ru_jsc_ctrl_tracker_ai_list
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