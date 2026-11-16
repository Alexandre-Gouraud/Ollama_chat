import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES, LOCALE_COOKIE, isLocale, negotiateLocale } from '@/i18n/config';

/**
 * Internationalisation (guide i18n de Next.js) : toute page vit sous
 * /{langue}. Une URL sans langue est redirigée vers la langue choisie par le
 * visiteur (cookie NEXT_LOCALE), sinon vers celle de son navigateur
 * (Accept-Language), sinon vers la langue par défaut (anglais).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const first = pathname.split('/')[1];
  if (LOCALES.some((locale) => locale === first)) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get('accept-language'));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  const response = NextResponse.redirect(url);
  // La cible dépend du cookie et de l'en-tête : un cache ne doit pas la partager.
  response.headers.set('Vary', 'Cookie, Accept-Language');
  return response;
}

export const config = {
  // Tout sauf les routes API (/api et /api/…), les fichiers internes de Next.js
  // et les fichiers statiques (chemins avec une extension : drapeaux, favicon…).
  matcher: ['/((?!api(?:/|$)|_next/|.*\\..*).*)'],
};
