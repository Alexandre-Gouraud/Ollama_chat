import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportConversationJSON, exportConversationMarkdown } from '@/lib/export';
import { en } from '@/i18n/messages/en';
import { fr } from '@/i18n/messages/fr';
import { Conversation } from '@/types/chat';

const conversation: Conversation = {
  id: 'c1',
  title: '',
  model: 'llama3.2',
  messages: [
    { id: '1', role: 'system', content: 'Sois bref', createdAt: '' },
    { id: '2', role: 'user', content: 'Bonjour', createdAt: '' },
    { id: '3', role: 'assistant', content: 'Salut', createdAt: '' },
  ],
  createdAt: '',
  updatedAt: '',
};

/** Dernier téléchargement déclenché : contenu (Blob) et nom de fichier. */
let download: { blob?: Blob; filename?: string };

beforeEach(() => {
  download = {};
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: (blob: Blob) => {
      download.blob = blob;
      return 'blob:test';
    },
    revokeObjectURL: () => {},
  });
  // jsdom ne gère pas la navigation déclenchée par le lien : on lit son nom de fichier.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    download.filename = this.download;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function downloadedText(): Promise<string> {
  expect(download.blob).toBeInstanceOf(Blob);
  return (download.blob as Blob).text();
}

describe('exportConversationMarkdown', () => {
  it('writes French headings followed by each message', async () => {
    exportConversationMarkdown(conversation, fr.export);
    const md = await downloadedText();
    expect(md).toContain('# Conversation');
    expect(md).toContain('> Modèle : llama3.2');
    expect(md).toContain('## Système\n\nSois bref');
    expect(md).toContain('## Vous\n\nBonjour');
    expect(md).toContain('## Assistant\n\nSalut');
  });

  it('writes English headings', async () => {
    exportConversationMarkdown(conversation, en.export);
    const md = await downloadedText();
    expect(md).toContain('> Model: llama3.2');
    expect(md).toContain('## System\n\nSois bref');
    expect(md).toContain('## You\n\nBonjour');
    expect(md).toContain('## Assistant\n\nSalut');
  });

  it('uses the assistant message model as heading when known', async () => {
    const withModel: Conversation = {
      ...conversation,
      messages: [{ id: '4', role: 'assistant', content: 'Hi', model: 'qwen2.5', createdAt: '' }],
    };
    exportConversationMarkdown(withModel, en.export);
    expect(await downloadedText()).toContain('## qwen2.5\n\nHi');
  });

  it('names the file after a slug of the title', () => {
    exportConversationMarkdown(conversation, fr.export);
    expect(download.filename).toBe('ollama-chat-conversation.md');

    exportConversationMarkdown({ ...conversation, title: 'Été à Paris' }, fr.export);
    expect(download.filename).toBe('ollama-chat-ete-a-paris.md');
  });
});

describe('exportConversationJSON', () => {
  it('downloads the whole conversation as JSON', async () => {
    exportConversationJSON({ ...conversation, title: 'Été à Paris' });
    expect(download.filename).toBe('ollama-chat-ete-a-paris.json');
    expect(download.blob?.type).toBe('application/json');
    expect(JSON.parse(await downloadedText())).toEqual({ ...conversation, title: 'Été à Paris' });
  });
});
