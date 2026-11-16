import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { renderWithI18n } from './i18n-utils';

const push = vi.fn();
let pathname = '/fr';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

function clearLocaleCookie() {
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    push.mockClear();
    pathname = '/fr';
    clearLocaleCookie();
    sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    vi.restoreAllMocks();
  });

  it('shows the current flag and code with a hidden label', () => {
    renderWithI18n(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /Changer de langue/ });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(within(button).getByText('FR')).toBeTruthy();
    expect(button.querySelector('img')?.getAttribute('src')).toBe('/images/flags/fr.svg');
    // Drapeau décoratif : alt vide.
    expect(button.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('starts its accessible name with the visible code (WCAG 2.5.3)', () => {
    renderWithI18n(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'FR – Changer de langue' })).toBeTruthy();
  });

  it('uses the English label under the English locale', () => {
    pathname = '/en';
    renderWithI18n(<LanguageSwitcher />, { locale: 'en' });
    const button = screen.getByRole('button', { name: /Change language/ });
    expect(within(button).getByText('EN')).toBeTruthy();
  });

  it('opens a menu listing both languages, written in their own language', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    expect(screen.queryByRole('list', { name: 'Choisir la langue' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    const menu = screen.getByRole('list', { name: 'Choisir la langue' });
    const french = within(menu).getByRole('button', { name: 'Français' });
    const english = within(menu).getByRole('button', { name: 'English' });
    expect(french.getAttribute('lang')).toBe('fr');
    expect(english.getAttribute('lang')).toBe('en');
    expect(screen.getByRole('button', { name: /Changer de langue/ }).getAttribute('aria-expanded')).toBe(
      'true'
    );
  });

  it('marks the active language with aria-current', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    expect(screen.getByRole('button', { name: 'Français' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-current')).toBeNull();
  });

  it('closes on Escape and returns focus to the button', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /Changer de langue/ });
    await user.click(button);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Français' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('list', { name: 'Choisir la langue' })).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <div>
        <LanguageSwitcher />
        <p>Ailleurs</p>
      </div>
    );
    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    await user.click(screen.getByText('Ailleurs'));
    expect(screen.queryByRole('list', { name: 'Choisir la langue' })).toBeNull();
  });

  it('switches language: sets the NEXT_LOCALE cookie and navigates', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /Changer de langue/ });
    await user.click(button);
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(document.cookie).toContain('NEXT_LOCALE=en');
    expect(push).toHaveBeenCalledWith('/en');
    expect(sessionStorage.getItem('ollama-chat-lang-switch')).toBe('1');
    expect(screen.queryByRole('list', { name: 'Choisir la langue' })).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('keeps the rest of the path when switching', async () => {
    const user = userEvent.setup();
    pathname = '/fr/chat';
    renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(push).toHaveBeenCalledWith('/en/chat');
  });

  it('keeps the query string and the hash when switching', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/fr?q=1#x');
    renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(push).toHaveBeenCalledWith('/en?q=1#x');
  });

  it('still switches when sessionStorage is unavailable', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(push).toHaveBeenCalledWith('/en');
    expect(document.cookie).toContain('NEXT_LOCALE=en');
  });

  it('restores focus on the switcher once the new locale has rendered', () => {
    // Drapeau posé juste avant la navigation, lu au montage dans la nouvelle langue.
    sessionStorage.setItem('ollama-chat-lang-switch', '1');
    pathname = '/en';
    renderWithI18n(<LanguageSwitcher />, { locale: 'en' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Change language/ }));
    expect(sessionStorage.getItem('ollama-chat-lang-switch')).toBeNull();
  });

  it('does nothing but close when picking the current language', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    await user.click(screen.getByRole('button', { name: /Changer de langue/ }));
    await user.click(screen.getByRole('button', { name: 'Français' }));
    expect(push).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain('NEXT_LOCALE');
    expect(screen.queryByRole('list', { name: 'Choisir la langue' })).toBeNull();
  });
});
