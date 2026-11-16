// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n/messages/en';
import { fr } from '@/i18n/messages/fr';

// Valeur du segment racine [lang] lue par next/root-params.
const lang = vi.fn<() => Promise<string>>();

vi.mock('next/root-params', () => ({ lang: () => lang() }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const { getDictionary, getLocale } = await import('@/i18n/dictionaries');

describe('server dictionaries', () => {
  beforeEach(() => lang.mockReset());

  it('returns the locale and dictionary of the [lang] segment', async () => {
    lang.mockResolvedValue('fr');
    expect(await getLocale()).toBe('fr');
    expect(await getDictionary()).toBe(fr);

    lang.mockResolvedValue('en');
    expect(await getDictionary()).toBe(en);
  });

  it('calls notFound for an unknown locale', async () => {
    lang.mockResolvedValue('de');
    await expect(getLocale()).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(getDictionary()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
