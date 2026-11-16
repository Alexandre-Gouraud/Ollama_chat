import type { Locale } from './config';

export type Values = Record<string, string | number>;

/** Remplace les variables `{nom}` d'un message ; une variable absente reste telle quelle. */
export function format(message: string, values: Values = {}): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

/** Unités de taille par langue (« Go/Mo » en français, « GB/MB » en anglais). */
const SIZE_UNITS: Record<Locale, { gb: string; mb: string }> = {
  fr: { gb: 'Go', mb: 'Mo' },
  en: { gb: 'GB', mb: 'MB' },
};

/**
 * Taille en octets lisible : « 1.3 Go » en français (format historique de
 * l'interface, conservé à l'identique), « 1.3 GB » en anglais. Tiret cadratin
 * pour une taille inconnue.
 */
export function formatSize(bytes: number | undefined, locale: Locale): string {
  if (!bytes || bytes <= 0) return '—';
  const units = SIZE_UNITS[locale];
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} ${units.gb}`;
  return `${Math.round(bytes / 1024 ** 2)} ${units.mb}`;
}
