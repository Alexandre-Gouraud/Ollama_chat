'use client';

import { useCallback, useRef, useState } from 'react';
import StarLogo from '@/components/ui/StarLogo';
import StatusLed from '@/components/ui/StatusLed';
import {
  PlusIcon,
  ChatBubbleIcon,
  TrashIcon,
  LoaderIcon,
  PenIcon,
  CheckIcon,
  XIcon,
  CloseIcon,
  SettingsIcon,
  MoonIcon,
  SunIcon,
} from '@/components/ui/Icons';
import { useDismiss } from '@/hooks/useDismiss';
import { useI18n } from '@/i18n/I18nProvider';
import { Conversation } from '@/types/chat';
import { Theme } from '@/lib/theme';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  maxTokens: number;
  onMaxTokensChange: (t: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (s: string) => void;
  onNewConversation: () => void;
  onSwitchConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  isLoading?: boolean;
  mounted?: boolean;
  /** Statut de connexion Ollama (fourni par le parent). */
  online?: boolean;
  onOpenSettings?: () => void;
  /** Thème courant + bascule (piloté par useAppSettings). */
  theme?: Theme;
  onToggleTheme?: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  systemPrompt,
  onSystemPromptChange,
  onNewConversation,
  onSwitchConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false,
  mounted = false,
  online = false,
  onOpenSettings,
  theme = 'dark',
  onToggleTheme,
}: Props) {
  const { t } = useI18n();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Confirmation de suppression inline (même pattern que la topbar) : un seul
  // popover ouvert à la fois, fermé par clic extérieur ou Échap.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const confirmPopoverRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const closeConfirm = useCallback(() => setConfirmingId(null), []);
  useDismiss(confirmPopoverRef, confirmingId !== null, closeConfirm);

  return (
    <nav
      aria-label={t.sidebar.nav}
      className="h-full w-[280px] flex flex-col bg-bg-sidebar border-r border-border-subtle"
    >
      {/* Header logo */}
      <div className="flex items-center gap-3 px-5 h-[68px] shrink-0">
        <StarLogo size={26} gradient />
        <span className="text-[22px] font-bold gradient-text whitespace-nowrap leading-none">
          Ollama Chat
        </span>
      </div>

      {/* Nouvelle conversation */}
      <div className="px-4 pb-3 shrink-0">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-3 px-4 min-h-[44px] rounded-xl border border-border hover:bg-bg-hover hover:border-border-strong transition-colors text-[15px] text-text-primary font-medium"
        >
          <PlusIcon size={18} />
          {t.common.newConversation}
        </button>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        <p className="text-[11px] uppercase tracking-[0.09em] text-text-label mb-2 px-2 font-semibold">
          {t.sidebar.conversations}
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <LoaderIcon size={20} color="var(--accent)" />
          </div>
        )}

        {!isLoading && !mounted && (
          <div className="space-y-2">
            {[80, 60, 90, 70].map((w, i) => (
              <div
                key={i}
                className="h-10 rounded-xl bg-bg-hover animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {!isLoading && mounted && conversations.length === 0 && (
          <p className="text-sm text-text-muted px-3 py-6 text-center">{t.sidebar.empty}</p>
        )}

        {mounted && conversations.length > 0 && (
          <ul className="space-y-1">
            {conversations.map((conv) => {
              const active = conv.id === activeId;
              const renaming = renamingId === conv.id;
              const confirming = confirmingId === conv.id;
              return (
                <li key={conv.id} className="relative">
                  <div
                    className={`group flex items-center gap-2 px-3 min-h-[44px] rounded-xl cursor-pointer transition-colors ${
                      active
                        ? 'bg-bg-hover text-text-primary'
                        : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                    onClick={() => {
                      if (!renaming) onSwitchConversation(conv.id);
                    }}
                  >
                    <ChatBubbleIcon size={16} className="shrink-0" />

                    {renaming ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          autoFocus
                          aria-label={t.sidebar.renameInput}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onRenameConversation(conv.id, renameValue.trim() || conv.title);
                              setRenamingId(null);
                            }
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 min-w-0 bg-bg-field border border-accent rounded-lg px-2 py-1 text-sm text-text-primary outline-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameConversation(conv.id, renameValue.trim() || conv.title);
                            setRenamingId(null);
                          }}
                          aria-label={t.sidebar.confirm}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
                        >
                          <CheckIcon size={15} color="var(--color-led-on)" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(null);
                          }}
                          aria-label={t.common.cancel}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors"
                        >
                          <XIcon size={15} color="var(--color-text-muted)" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm">{conv.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(conv.id);
                            setRenameValue(conv.title);
                          }}
                          aria-label={t.sidebar.rename}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <PenIcon size={13} color="var(--color-text-muted)" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingId(conv.id);
                            // Déplace le focus sur l'action destructive une fois
                            // le popover monté.
                            requestAnimationFrame(() => confirmBtnRef.current?.focus());
                          }}
                          aria-label={t.common.delete}
                          aria-haspopup="dialog"
                          aria-expanded={confirming}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-led-off/15 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <TrashIcon size={14} color="var(--color-text-muted)" />
                        </button>
                      </>
                    )}
                  </div>

                  {confirming && (
                    <div
                      ref={confirmPopoverRef}
                      role="dialog"
                      aria-label={t.common.confirmDelete}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full right-0 mt-1 w-[240px] bg-bg-card border border-border rounded-xl shadow-2xl z-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm text-text-primary leading-snug">
                          {t.common.deleteConversationQuestion}
                        </p>
                        <button
                          type="button"
                          onClick={closeConfirm}
                          aria-label={t.common.cancelDelete}
                          className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                        >
                          <CloseIcon size={14} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={closeConfirm}
                          className="flex-1 h-9 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          ref={confirmBtnRef}
                          type="button"
                          onClick={() => {
                            onDeleteConversation(conv.id);
                            setConfirmingId(null);
                          }}
                          className="flex-1 h-9 rounded-lg bg-led-off text-white text-sm font-medium hover:brightness-110 transition-all"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bloc contrôles bas */}
      <div className="border-t border-border-subtle p-4 space-y-4 shrink-0">
        {/* Température */}
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
            <span className="font-medium">{t.sidebar.temperature}</span>
            <span className="font-mono text-text-secondary">{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            aria-label={t.sidebar.temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Max tokens */}
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-2 px-1">
            <span className="font-medium">{t.sidebar.maxTokens}</span>
            <span className="font-mono text-text-secondary">{maxTokens}</span>
          </div>
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={maxTokens}
            aria-label={t.sidebar.maxTokensLabel}
            onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Contexte */}
        <textarea
          rows={3}
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder={t.sidebar.contextPlaceholder}
          aria-label={t.sidebar.contextLabel}
          className="w-full text-sm bg-bg-field border border-border rounded-xl px-3 py-2 text-text-primary placeholder:text-text-placeholder resize-none focus:border-accent focus:outline-none transition-colors"
        />

        {/* Pied : statut connexion + actions (paramètres, thème) */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 min-w-0">
            <StatusLed
              on={online}
              stateLabel={online ? t.status.connected : t.status.disconnected}
              label={online ? t.sidebar.ollamaConnected : t.sidebar.ollamaDisconnected} />
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label={t.sidebar.openSettings}
              className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <SettingsIcon size={18} />
            </button>
          )}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={
                mounted && theme === 'light' ? t.sidebar.darkTheme : t.sidebar.lightTheme
              }
              aria-pressed={mounted ? theme === 'light' : false}
              className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              {mounted && theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
