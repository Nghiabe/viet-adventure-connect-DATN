import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    // --- CORE CHANGES FOR SINGLE-LANGUAGE MODE ---
    lng: 'vi', // Hardcode the active language to Vietnamese.
    fallbackLng: 'vi', // Set the fallback language to Vietnamese.
    supportedLngs: ['vi'], // Define Vietnamese as the only supported language.
    // --- END CORE CHANGES ---

    // The LanguageDetector module and `detection` configuration object are now completely removed.

    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;


