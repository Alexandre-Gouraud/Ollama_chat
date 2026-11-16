import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_INFO,
  isLocale,
  negotiateLocale,
} from '@/i18n/config';
import { format, formatSize } from '@/i18n/format';
import { MESSAGE_LOADERS } from '@/i18n/messages';
import { en } from '@/i18n/messages/en';
import { fr } from '@/i18n/messages/fr';
import { localizePath, stripLocale } from '@/i18n/navigation';

/** Chemins de toutes les feuilles d'un dictionnaire : « common.cancel »… */
function leafKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`)
  );
}

function leaves(obj: object): string[] {
  return Object.values(obj).flatMap((value) => (typeof value === 'string' ? [value] : leaves(value)));
}

describe('dictionaries', () => {
  it('fr and en have exactly the same keys', () => {
    expect(leafKeys(en).sort()).toEqual(leafKeys(fr).sort());
  });

  it('have no empty message', () => {
    for (const value of [...leaves(fr), ...leaves(en)]) expect(value.trim()).not.toBe('');
  });

  it('use the same variables in both languages', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const frMap = Object.fromEntries(leafKeys(fr).map((k, i) => [k, leaves(fr)[i]]));
    const enMap = Object.fromEntries(leafKeys(en).map((k, i) => [k, leaves(en)[i]]));
    for (const key of Object.keys(frMap)) expect(vars(enMap[key])).toEqual(vars(frMap[key]));
  });

  it('keep chat error messages prefixed with ❌ (rendered in red)', () => {
    for (const dict of [fr, en]) {
      for (const message of Object.values(dict.chatErrors)) expect(message.startsWith('❌')).toBe(true);
    }
  });

  it('load lazily for every locale', async () => {
    expect(await MESSAGE_LOADERS.fr()).toBe(fr);
    expect(await MESSAGE_LOADERS.en()).toBe(en);
  });
});

describe('locale config', () => {
  it('supports fr and en with en as default', () => {
    expect([...LOCALES]).toEqual(['fr', 'en']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('describes each language in its own language with a local flag', () => {
    expect(LOCALE_INFO.fr).toMatchObject({ name: 'Français', short: 'FR', flag: '/images/flags/fr.svg' });
    expect(LOCALE_INFO.en).toMatchObject({ name: 'English', short: 'EN', flag: '/images/flags/gb.svg' });
  });

  it('isLocale only accepts supported locales', () => {
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale('FR')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('negotiateLocale', () => {
  it('falls back to the default locale without header', () => {
    expect(negotiateLocale(null)).toBe('en');
    expect(negotiateLocale('')).toBe('en');
  });

  it('picks the first supported language by quality', () => {
    expect(negotiateLocale('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
    expect(negotiateLocale('en-US,en;q=0.9,fr;q=0.8')).toBe('en');
    expect(negotiateLocale('de;q=1,fr;q=0.4,en;q=0.7')).toBe('en');
  });

  it('ignores unsupported languages and q=0', () => {
    expect(negotiateLocale('de-DE,es;q=0.9,fr;q=0.5')).toBe('fr');
    expect(negotiateLocale('fr;q=0,de')).toBe('en');
  });

  it('keeps header order on equal quality and is case-insensitive', () => {
    expect(negotiateLocale('FR-ca, en')).toBe('fr');
    expect(negotiateLocale('*')).toBe('en');
  });
});

describe('format helpers', () => {
  it('replaces variables and keeps unknown ones', () => {
    expect(format('Supprimer {name}', { name: 'Claude' })).toBe('Supprimer Claude');
    expect(format('HTTP {status}', { status: 404 })).toBe('HTTP 404');
    expect(format('{missing}')).toBe('{missing}');
  });

  it('keeps the historical French size format and uses GB/MB in English', () => {
    const gb = 1.25 * 1024 ** 3;
    // Français identique à l'interface d'origine : point décimal, espace normale.
    expect(formatSize(gb, 'fr')).toBe('1.3 Go');
    expect(formatSize(512 * 1024 ** 2, 'fr')).toBe('512 Mo');
    expect(formatSize(4 * 1024 ** 3, 'fr')).toBe('4.0 Go');
    expect(formatSize(gb, 'en')).toBe('1.3 GB');
    expect(formatSize(512 * 1024 ** 2, 'en')).toBe('512 MB');
    expect(formatSize(0, 'fr')).toBe('—');
    expect(formatSize(undefined, 'en')).toBe('—');
  });
});

describe('localized paths', () => {
  it('strips the locale segment', () => {
    expect(stripLocale('/fr')).toBe('/');
    expect(stripLocale('/en/settings')).toBe('/settings');
    expect(stripLocale('/other')).toBe('/other');
  });

  it('prefixes a path with the locale', () => {
    expect(localizePath('fr', '/')).toBe('/fr');
    expect(localizePath('en', '/settings')).toBe('/en/settings');
  });
});
