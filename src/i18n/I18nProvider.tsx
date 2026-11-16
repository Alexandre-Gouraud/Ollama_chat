'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LOCALE_INFO, type Locale } from './config';
import { format, formatSize, type Values } from './format';
import type { Messages } from './messages';

interface I18nValue {
  locale: Locale;
  /** Locale BCP 47 pour Intl (« fr-FR », « en-GB »). */
  intl: string;
  /** Messages de la langue courante, structurés par espace de noms. */
  t: Messages;
  /** Message avec variables : f(t.sources.remove, { name }). */
  f: (message: string, values?: Values) => string;
  /** Taille de modèle au format de la langue. */
  size: (bytes?: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Donne aux Client Components la langue de l'URL et ses messages, chargés côté
 * serveur par le layout racine : seul le dictionnaire de la langue courante
 * est envoyé au navigateur.
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      intl: LOCALE_INFO[locale].intl,
      t: messages,
      f: format,
      size: (bytes) => formatSize(bytes, locale),
    }),
    [locale, messages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n doit être utilisé sous <I18nProvider>.');
  return value;
}
