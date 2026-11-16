import type { Messages } from '@/i18n/messages';
import { Source, SourceTemplate } from '@/types/source';

export const SOURCES_STORAGE_KEY = 'ollama-chat-sources';

/**
 * Source Ollama locale, toujours présente et non supprimable. Les libellés
 * français ci-dessous (et ceux de SOURCE_TEMPLATES) sont des valeurs de repli
 * stockées avec la source : l'affichage passe par localizeSource /
 * localizeTemplate, qui les remplacent par ceux du dictionnaire courant.
 */
export const OLLAMA_SOURCE: Source = {
  id: 'ollama-local',
  kind: 'ollama',
  name: 'Ollama local',
  subtitle: 'Modèles exécutés sur votre machine',
  tint: '#8b5cf6',
  removable: false,
  requiresKey: false,
};

/** Sources ajoutables depuis l'onglet « Sources ». */
export const SOURCE_TEMPLATES: SourceTemplate[] = [
  { kind: 'claude', label: 'Claude', subtitle: 'Anthropic', tint: '#d97757', requiresKey: true },
  { kind: 'gpt', label: 'GPT', subtitle: 'OpenAI', tint: '#10a37f', requiresKey: true },
  { kind: 'mistral', label: 'Mistral', subtitle: 'Mistral AI', tint: '#f97316', requiresKey: true },
  { kind: 'gemini', label: 'Gemini', subtitle: 'Google', tint: '#4285f4', requiresKey: true },
  { kind: 'custom', label: 'Autre', subtitle: 'Source personnalisée', tint: '#64748b', requiresKey: true, editableName: true },
];

export function defaultSources(): Source[] {
  return [{ ...OLLAMA_SOURCE }];
}

/** Une source est « connectée » si elle n'exige pas de clé, ou si une clé est renseignée. */
export function isSourceConnected(source: Source, ollamaOnline: boolean): boolean {
  if (source.kind === 'ollama') return ollamaOnline;
  if (!source.requiresKey) return true;
  return Boolean(source.apiKey && source.apiKey.trim().length > 0);
}

type SourceLabels = Messages['sources'];

/**
 * Nom et sous-titre affichés d'une source, dans la langue de l'interface. Seuls
 * les libellés intégrés sont traduits : Ollama local (non éditable) et le
 * sous-titre des sources personnalisées. Les noms de marque et les noms saisis
 * par l'utilisateur restent tels quels.
 */
export function localizeSource(source: Source, labels: SourceLabels): { name: string; subtitle: string } {
  if (source.kind === 'ollama') return { name: labels.ollamaName, subtitle: labels.ollamaSubtitle };
  if (source.kind === 'custom') return { name: source.name, subtitle: labels.customSubtitle };
  return { name: source.name, subtitle: source.subtitle };
}

/** Modèle de source traduit (libellé du bouton et nom par défaut de la source créée). */
export function localizeTemplate(template: SourceTemplate, labels: SourceLabels): SourceTemplate {
  if (template.kind !== 'custom') return template;
  return { ...template, label: labels.customLabel, subtitle: labels.customSubtitle };
}

/** Initiale affichée dans le badge de la source. */
export function sourceInitial(source: Source): string {
  return (source.name.trim()[0] || '?').toUpperCase();
}
