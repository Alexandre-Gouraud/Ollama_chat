// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/chat/title/route';

const messages = [{ role: 'user', content: 'How do I sort an array in JavaScript?' }];

function req(body: unknown) {
  return new NextRequest('http://localhost:3000/api/chat/title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Réponse Ollama simulée ; renvoie les messages envoyés au modèle. */
function mockOllama(content: string) {
  const fetchMock = vi.fn(async () => Response.json({ message: { content } }));
  vi.stubGlobal('fetch', fetchMock);
  return () => {
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    return JSON.parse(String(init.body)).messages as { role: string; content: string }[];
  };
}

describe('POST /api/chat/title', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('asks the model for a French title when locale is fr', async () => {
    const sent = mockOllama('Trier un tableau');
    const res = await POST(req({ messages, model: 'llama3.2', locale: 'fr' }));
    expect(await res.json()).toEqual({ title: 'Trier un tableau' });
    const prompt = sent();
    expect(prompt[0].role).toBe('system');
    expect(prompt[0].content).toContain('en français');
    expect(prompt.at(-1)?.content).toContain('Génère un titre court');
  });

  it('asks the model for an English title when locale is en', async () => {
    const sent = mockOllama('Sorting arrays');
    const res = await POST(req({ messages, model: 'llama3.2', locale: 'en' }));
    expect(await res.json()).toEqual({ title: 'Sorting arrays' });
    const prompt = sent();
    expect(prompt[0].content).toContain('in English');
    expect(prompt.at(-1)?.content).toContain('Generate a short title');
  });

  it('falls back to the default locale (en) for a missing or invalid locale', async () => {
    for (const locale of [undefined, 'de', 42]) {
      const sent = mockOllama('Sorting arrays');
      await POST(req({ messages, model: 'llama3.2', locale }));
      expect(sent()[0].content).toContain('in English');
      vi.unstubAllGlobals();
    }
  });

  it('strips title prefixes and quotes in both languages', async () => {
    mockOllama('"Title: Sorting arrays"');
    let res = await POST(req({ messages, locale: 'en' }));
    expect((await res.json()).title).toBe('Sorting arrays');

    vi.unstubAllGlobals();
    mockOllama('Titre : Trier un tableau');
    res = await POST(req({ messages, locale: 'fr' }));
    expect((await res.json()).title).toBe('Trier un tableau');
  });

  it('only strips whole-word prefixes', async () => {
    mockOllama('Topical news');
    let res = await POST(req({ messages, locale: 'en' }));
    expect((await res.json()).title).toBe('Topical news');

    vi.unstubAllGlobals();
    mockOllama('Titles of cats');
    res = await POST(req({ messages, locale: 'en' }));
    expect((await res.json()).title).toBe('Titles of cats');
  });

  it('truncates the title to 60 characters', async () => {
    mockOllama('a'.repeat(80));
    const res = await POST(req({ messages, locale: 'en' }));
    expect((await res.json()).title).toBe('a'.repeat(60));
  });

  it('answers 502 when Ollama responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })));
    const res = await POST(req({ messages, locale: 'fr' }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Failed to generate title' });
  });

  it('answers 500 with the error when Ollama is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    const res = await POST(req({ messages, locale: 'en' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('fetch failed');
  });

  it('returns the localized default title when the model answers nothing', async () => {
    mockOllama('');
    let res = await POST(req({ messages, locale: 'fr' }));
    expect((await res.json()).title).toBe('Nouvelle conversation');

    vi.unstubAllGlobals();
    mockOllama('');
    res = await POST(req({ messages, locale: 'en' }));
    expect((await res.json()).title).toBe('New conversation');
  });

  it('rejects a request without messages', async () => {
    mockOllama('x');
    const res = await POST(req({ messages: [], locale: 'fr' }));
    expect(res.status).toBe(400);
  });
});
