import { format } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import { Conversation } from '@/types/chat';

/** Libellés traduits des en-têtes de l'export Markdown. */
export type ExportLabels = Messages['export'];

/** Réduit un titre à un slug de fichier sûr (ASCII, minuscules, tirets). */
function slugify(title: string): string {
  const slug = (title || 'conversation')
    .toLowerCase()
    .normalize('NFD')
    // Retire les diacritiques (plage Unicode des marques combinantes).
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'conversation';
}

/** Déclenche le téléchargement client d'un contenu texte via un Blob éphémère. */
function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Exporte la conversation courante au format JSON. */
export function exportConversationJSON(conv: Conversation) {
  download(
    `ollama-chat-${slugify(conv.title)}.json`,
    JSON.stringify(conv, null, 2),
    'application/json'
  );
}

/**
 * Exporte la conversation courante au format Markdown lisible, avec des
 * en-têtes dans la langue de l'interface.
 */
export function exportConversationMarkdown(conv: Conversation, labels: ExportLabels) {
  const lines: string[] = [`# ${conv.title || labels.untitled}`, ''];
  if (conv.model) lines.push(`> ${format(labels.model, { model: conv.model })}`, '');
  for (const m of conv.messages) {
    const who =
      m.role === 'user'
        ? labels.you
        : m.role === 'assistant'
          ? m.model || labels.assistant
          : labels.system;
    lines.push(`## ${who}`, '', m.content || '', '');
  }
  download(
    `ollama-chat-${slugify(conv.title)}.md`,
    lines.join('\n'),
    'text/markdown'
  );
}
