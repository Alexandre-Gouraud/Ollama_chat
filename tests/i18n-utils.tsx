import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import type { Locale } from '@/i18n/config';
import { I18nProvider } from '@/i18n/I18nProvider';
import { en } from '@/i18n/messages/en';
import { fr } from '@/i18n/messages/fr';

const MESSAGES = { fr, en };

/**
 * Rendu sous <I18nProvider>. Français par défaut : les tests existants gardent
 * leurs assertions sur les libellés d'origine.
 */
export function renderWithI18n(
  ui: ReactElement,
  { locale = 'fr', ...options }: { locale?: Locale } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nProvider locale={locale} messages={MESSAGES[locale]}>
        {children}
      </I18nProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
