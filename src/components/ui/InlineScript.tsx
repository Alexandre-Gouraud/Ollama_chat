'use client';

/**
 * Script inline exécuté pendant l'analyse du HTML, avant le premier paint
 * (guide Next.js « Preventing flash before hydration »). Côté client, React ne
 * doit pas recréer de <script> exécutable — c'est le cas lors du changement de
 * langue (/fr → /en), qui re-rend le layout racine : le type devient
 * text/plain et suppressHydrationWarning accepte la différence.
 */
export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
