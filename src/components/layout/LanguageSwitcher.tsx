'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CheckIcon } from '@/components/ui/Icons';
import { useDismiss } from '@/hooks/useDismiss';
import { LOCALES, LOCALE_INFO, type Locale } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import { useSwitchLocale } from '@/i18n/navigation';

// Le changement de langue est une navigation (/fr → /en) qui remonte l'arbre
// de la page : ce drapeau permet de rendre le focus au nouveau bouton.
const SWITCH_KEY = 'ollama-chat-lang-switch';

/** Drapeau décoratif : le nom ou le code de la langue est toujours écrit à côté. */
function Flag({ locale }: { locale: Locale }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petit SVG local, pas d'optimisation utile
    <img
      src={LOCALE_INFO[locale].flag}
      alt=""
      width={20}
      height={14}
      className="block h-3.5 w-5 shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,.18)]"
    />
  );
}

/**
 * Sélecteur de langue de la barre du haut. Bouton : drapeau + code (« FR »,
 * « EN ») dès `sm`, drapeau seul en dessous, avec un libellé masqué « Changer
 * de langue ». Menu : chaque langue écrite dans sa langue avec l'attribut
 * lang ; la langue active porte aria-current et une coche. Fermeture par
 * sélection, Échap ou clic extérieur ; le choix est mémorisé dans le cookie
 * NEXT_LOCALE (voir src/proxy.ts).
 */
export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const switchLocale = useSwitchLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = LOCALE_INFO[locale];

  // Échap ou clic extérieur : rend le focus au bouton seulement s'il était
  // dans le menu (un clic ailleurs laisse le focus là où l'utilisateur l'a mis).
  const close = useCallback(() => {
    const focusInside = rootRef.current?.contains(document.activeElement);
    setOpen(false);
    if (focusInside) buttonRef.current?.focus();
  }, []);
  useDismiss(rootRef, open, close);

  // Après un changement de langue, rend le focus au sélecteur (effet DOM pur).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SWITCH_KEY) !== '1') return;
      sessionStorage.removeItem(SWITCH_KEY);
    } catch {
      return;
    }
    buttonRef.current?.focus();
  }, [locale]);

  const pick = (next: Locale) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (next === locale) return;
    try {
      sessionStorage.setItem(SWITCH_KEY, '1');
    } catch {
      // Sans stockage, la langue change quand même, sans restauration du focus.
    }
    switchLocale(next);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        // Nom accessible « FR – Changer de langue » : il commence par le code
        // visible (WCAG 2.5.3), y compris sur petit écran où seul le drapeau s'affiche.
        aria-label={`${current.short} – ${t.language.change}`}
        className="flex items-center gap-1.5 pl-2 pr-2 sm:pl-2.5 sm:pr-2.5 h-9 rounded-lg bg-bg-field border border-border hover:bg-bg-field-hover transition-colors text-text-primary"
      >
        <Flag locale={locale} />
        <span className="hidden sm:inline text-xs sm:text-sm font-medium">{current.short}</span>
      </button>

      <ul
        id={menuId}
        hidden={!open}
        aria-label={t.language.menu}
        className="absolute top-full right-0 mt-2 w-[180px] max-w-[80vw] bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 p-1"
      >
        {LOCALES.map((code) => {
          const active = code === locale;
          return (
            <li key={code}>
              <button
                type="button"
                lang={code}
                aria-current={active ? 'true' : undefined}
                onClick={() => pick(code)}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm hover:bg-bg-hover transition-colors"
              >
                <Flag locale={code} />
                <span className={`flex-1 truncate ${active ? 'text-accent font-medium' : 'text-text-primary'}`}>
                  {LOCALE_INFO[code].name}
                </span>
                {active && <CheckIcon size={15} color="var(--accent)" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
