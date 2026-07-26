import * as Localization from 'expo-localization';
import React from 'react';
import { PhoneGuard } from '../native/PhoneGuard';
import { Dict, Language, LanguagePreference, supportedLanguages, translations } from './translations';

function deviceLanguage(): Language {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return (supportedLanguages as string[]).includes(code) ? (code as Language) : 'en';
}

function resolve(preference: LanguagePreference): Language {
  return preference === 'system' ? deviceLanguage() : preference;
}

export function useI18n(): { t: Dict; language: Language; preference: LanguagePreference; setPreference: (value: LanguagePreference) => void } {
  const [preference, setPreferenceState] = React.useState<LanguagePreference>(() => (PhoneGuard.getLanguage() as LanguagePreference) || 'system');
  const setPreference = (value: LanguagePreference) => { setPreferenceState(value); PhoneGuard.setLanguage(value); };
  const language = resolve(preference);
  return { t: translations[language], language, preference, setPreference };
}
