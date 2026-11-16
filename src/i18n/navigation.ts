'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { LOCALE_COOKIE, isLocale, type Locale } from './config';

/** Durée de vie du cookie de langue : un an. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Retire le segment de langue d'un chemin : /fr/x → /x, /en → /. */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split('/');
  return isLocale(first) ? `/${rest.join('/')}` : pathname;
}

/** Préfixe un chemin sans langue par la langue : (fr, /) → /fr, (en, /x) → /en/x. */
export function localizePath(locale: Locale, path: string): string {
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** Mémorise le choix explicite de langue (lu par src/proxy.ts). */
export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Change de langue en restant sur la même page (query et hash conservés), et
 * mémorise le choix pour les prochaines visites sans langue dans l'URL.
 */
export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (next: Locale) => {
      persistLocale(next);
      const path = stripLocale(pathname || '/');
      router.push(`${localizePath(next, path)}${window.location.search}${window.location.hash}`);
    },
    [router, pathname]
  );
}
