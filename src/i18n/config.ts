/**
 * Langues de l'interface. La langue fait partie de l'URL (/fr, /en), selon le
 * guide d'internationalisation de Next.js : le proxy (src/proxy.ts) redirige
 * les URL sans langue, le layout racine app/[lang] la lit.
 *
 * Module sans dépendance serveur ni client : partagé par le proxy, les route
 * handlers, les Server Components et les Client Components.
 */
export const LOCALES = ['fr', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Dernier choix explicite du visiteur, prioritaire sur Accept-Language. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export interface LocaleInfo {
  code: Locale;
  /** Nom de la langue écrit dans cette langue (affiché avec l'attribut lang). */
  name: string;
  /** Code court affiché dans le bouton du sélecteur. */
  short: string;
  /** Drapeau décoratif, dans public/images/flags. */
  flag: string;
  /** Locale BCP 47 utilisée par Intl (nombres, dates). */
  intl: string;
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  fr: { code: 'fr', name: 'Français', short: 'FR', flag: '/images/flags/fr.svg', intl: 'fr-FR' },
  en: { code: 'en', name: 'English', short: 'EN', flag: '/images/flags/gb.svg', intl: 'en-GB' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Langue préférée d'après l'en-tête Accept-Language (« fr-FR,fr;q=0.9,en;q=0.8 ») :
 * la première langue supportée par ordre de qualité, sinon la langue par défaut.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((param) => param.trim().startsWith('q='));
      const quality = q ? Number(q.trim().slice(2)) : 1;
      return {
        language: tag.trim().toLowerCase().split('-')[0],
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter((entry) => entry.quality > 0)
    // Tri stable : à qualité égale, l'ordre de l'en-tête est conservé.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  return ranked.map((entry) => entry.language).find(isLocale) ?? DEFAULT_LOCALE;
}
