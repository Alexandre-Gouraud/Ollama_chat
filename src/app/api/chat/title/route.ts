import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';
import { MESSAGE_LOADERS } from '@/i18n/messages';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Consignes envoyées au modèle, dans la langue de l'interface : le titre est
 * ainsi généré dans cette langue, quelle que soit celle de la conversation.
 * Gardées côté serveur (pas dans les dictionnaires envoyés au navigateur).
 */
const TITLE_PROMPTS: Record<Locale, { system: string; user: (excerpt: string) => string }> = {
  fr: {
    system:
      'Tu es un assistant qui génère des titres courts (max 5 mots) pour des conversations de chat. Réponds uniquement avec le titre, en français, sans ponctuation ni guillemets.',
    user: (excerpt) =>
      `Génère un titre court (max 5 mots) en français pour cette conversation: "${excerpt}"`,
  },
  en: {
    system:
      'You are an assistant that generates short titles (max 5 words) for chat conversations. Reply with the title only, in English, without punctuation or quotes.',
    user: (excerpt) =>
      `Generate a short title (max 5 words) in English for this conversation: "${excerpt}"`,
  },
};

/**
 * Préfixes parasites que certains modèles ajoutent avant le titre. `\b` impose
 * un mot entier : « Topical news » ou « Titles of cats » restent intacts.
 */
const TITLE_PREFIX =
  /^(Titre de la conversation|Conversation title|Conversation|Sujet|Titre|Title|Topic)\b\s*[:\-]?\s*/i;

export async function POST(req: NextRequest) {
  try {
    const { messages, model, locale: requested } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    // Langue fournie par le client, validée : valeur inconnue → langue par défaut.
    const locale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
    const prompts = TITLE_PROMPTS[locale];

    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');

    const titleMessages = [
      { role: 'system', content: prompts.system },
      ...messages.slice(0, 2),
    ];

    if (lastUserMessage) {
      titleMessages.push({
        role: 'user',
        content: prompts.user(String(lastUserMessage.content ?? '').slice(0, 100)),
      });
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || process.env.DEFAULT_MODEL || 'llama3.2',
        messages: titleMessages,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 30,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate title' }, { status: 502 });
    }

    const data = await response.json();
    const rawTitle = data.message?.content?.trim() || '';

    const title = rawTitle
      .replace(/^["']|["']$/g, '')
      .replace(TITLE_PREFIX, '')
      .slice(0, 60);

    const fallback = (await MESSAGE_LOADERS[locale]()).common.newConversation;
    return NextResponse.json({ title: title || fallback });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
