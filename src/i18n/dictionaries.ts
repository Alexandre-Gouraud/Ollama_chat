import { notFound } from 'next/navigation';
import { lang } from 'next/root-params';
import { isLocale, type Locale } from './config';
import { MESSAGE_LOADERS, type Messages } from './messages';

/**
 * Chargement des messages côté serveur (guide i18n de Next.js) : la langue
 * vient du segment racine app/[lang], lu avec next/root-params — aucun appel
 * n'a besoin de la recevoir en paramètre. L'import de next/root-params échoue
 * au build si ce module est utilisé dans un Client Component.
 */

/** Langue de la requête courante ; une langue inconnue donne une 404. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Messages> {
  return MESSAGE_LOADERS[await getLocale()]();
}
