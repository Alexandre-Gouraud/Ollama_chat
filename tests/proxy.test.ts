// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from '@/proxy';

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

function location(res: Response) {
  return new URL(res.headers.get('location')!);
}

describe('proxy', () => {
  it('redirects / to /en by default', () => {
    const res = proxy(req('/'));
    expect(res.status).toBe(307);
    expect(location(res).pathname).toBe('/en');
  });

  it('redirects to the browser language (Accept-Language)', () => {
    const res = proxy(req('/', { 'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8' }));
    expect(location(res).pathname).toBe('/fr');
  });

  it('prefers the NEXT_LOCALE cookie over Accept-Language', () => {
    const res = proxy(req('/', { 'accept-language': 'en-US,en;q=0.9', cookie: 'NEXT_LOCALE=fr' }));
    expect(location(res).pathname).toBe('/fr');
  });

  it('ignores an invalid cookie', () => {
    const res = proxy(req('/', { 'accept-language': 'fr', cookie: 'NEXT_LOCALE=xx' }));
    expect(location(res).pathname).toBe('/fr');
  });

  it('keeps the rest of the path and the query string', () => {
    const res = proxy(req('/chat?q=1', { cookie: 'NEXT_LOCALE=fr' }));
    expect(location(res).pathname).toBe('/fr/chat');
    expect(location(res).search).toBe('?q=1');
  });

  it('prefixes an unsupported locale-like segment instead of replacing it', () => {
    const res = proxy(req('/de/x'));
    expect(location(res).pathname).toBe('/en/de/x');
  });

  it('keeps the query string on the root URL', () => {
    const res = proxy(req('/?q=1'));
    expect(location(res).pathname).toBe('/en');
    expect(location(res).search).toBe('?q=1');
  });

  it('lets the en cookie win over a French Accept-Language', () => {
    const res = proxy(req('/', { 'accept-language': 'fr-FR,fr;q=0.9', cookie: 'NEXT_LOCALE=en' }));
    expect(location(res).pathname).toBe('/en');
  });

  it('falls back to en for an unsupported Accept-Language', () => {
    const res = proxy(req('/', { 'accept-language': 'de-DE,de;q=0.9' }));
    expect(location(res).pathname).toBe('/en');
  });

  it('marks redirects as varying on Cookie and Accept-Language', () => {
    const vary = proxy(req('/')).headers.get('vary') ?? '';
    expect(vary).toMatch(/Cookie/);
    expect(vary).toMatch(/Accept-Language/);
  });

  it('passes through URLs that already have a locale', () => {
    for (const path of ['/fr', '/en', '/en/anything']) {
      const res = proxy(req(path, { cookie: 'NEXT_LOCALE=fr' }));
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  });
});

describe('proxy config.matcher', () => {
  // Next.js ancre les motifs du matcher (path-to-regexp) : émulation avec ^…$.
  const regex = new RegExp(`^${config.matcher[0]}$`);

  it('matches pages, with or without locale', () => {
    for (const p of ['/', '/fr', '/en', '/chat', '/apiary']) expect(regex.test(p)).toBe(true);
  });

  it('leaves /api routes, Next internals and static files untouched', () => {
    for (const p of [
      '/api',
      '/api/chat',
      '/api/chat/title',
      '/api/ollama/api/tags',
      '/_next/static/chunks/app.js',
      '/favicon.ico',
      '/images/flags/fr.svg',
    ]) {
      expect(regex.test(p)).toBe(false);
    }
  });
});
