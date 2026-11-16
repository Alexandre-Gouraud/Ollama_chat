import type { Locale } from '../config';
import type { fr } from './fr';

/**
 * Forme commune des dictionnaires, déduite du français (langue de référence) :
 * chaque feuille est une chaîne, la structure est imposée à toutes les langues.
 */
type Shape<T> = T extends string ? string : { [K in keyof T]: Shape<T[K]> };

export type Messages = Shape<typeof fr>;

/** Chargeurs paresseux : seul le dictionnaire demandé est importé. */
export const MESSAGE_LOADERS: Record<Locale, () => Promise<Messages>> = {
  fr: () => import('./fr').then((module) => module.fr),
  en: () => import('./en').then((module) => module.en),
};
