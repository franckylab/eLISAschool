/**
 * ==================================
 * eLISAschool - Configuration i18n
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonFr from '@/locales/fr/common.json';
import commonEn from '@/locales/en/common.json';
import authFr from '@/locales/fr/auth.json';
import authEn from '@/locales/en/auth.json';
import dashboardFr from '@/locales/fr/dashboard.json';
import dashboardEn from '@/locales/en/dashboard.json';
import configurationFr from '@/locales/fr/configuration.json';
import configurationEn from '@/locales/en/configuration.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: {
                common: commonFr,
                auth: authFr,
                dashboard: dashboardFr,
                configuration: configurationFr,
            },
            en: {
                common: commonEn,
                auth: authEn,
                dashboard: dashboardEn,
                configuration: configurationEn,
            },
        },
        fallbackLng: 'fr',
        defaultNS: 'common',
        ns: ['common', 'auth', 'dashboard', 'configuration'],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
