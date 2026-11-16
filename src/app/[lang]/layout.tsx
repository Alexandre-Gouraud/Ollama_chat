import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import InlineScript from '@/components/ui/InlineScript';
import { LOCALES } from '@/i18n/config';
import { getDictionary, getLocale } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

/** Une version de l'application par langue (guide i18n de Next.js). */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** Titre et description traduits selon la langue de l'URL. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.title,
    description: t.meta.description,
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Applique l'accent et le thème persistés avant le paint pour éviter tout flash
// (couleur d'accent par défaut, ou thème sombre alors que le clair est mémorisé).
const themeInit = `(function(){try{var a=localStorage.getItem('ollama-chat-accent');if(a){document.documentElement.style.setProperty('--accent',a);}var t=localStorage.getItem('ollama-chat-theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

/**
 * Layout racine, un par langue : `<html lang>` suit le segment [lang] et le
 * dictionnaire de cette seule langue est transmis aux Client Components.
 */
export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale();
  const messages = await getDictionary();

  return (
    // suppressHydrationWarning : le script anti-FOUC mute className/style de <html>
    // avant l'hydratation (classe `light`, variable --accent) — mutation attendue.
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        {/* Exécuté pendant l'analyse du HTML, avant le premier paint (anti-FOUC). */}
        <InlineScript html={themeInit} />
      </head>
      <body className={inter.className}>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
