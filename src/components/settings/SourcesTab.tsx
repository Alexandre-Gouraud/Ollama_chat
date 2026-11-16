'use client';

import { PlusIcon, TrashIcon } from '@/components/ui/Icons';
import { Source, SourceTemplate } from '@/types/source';
import { useI18n } from '@/i18n/I18nProvider';
import {
  SOURCE_TEMPLATES,
  isSourceConnected,
  localizeSource,
  localizeTemplate,
  sourceInitial,
} from '@/lib/sources';

interface Props {
  sources: Source[];
  ollamaOnline: boolean;
  onAddSource: (t: SourceTemplate) => void;
  onRemoveSource: (id: string) => void;
  onUpdateKey: (id: string, key: string) => void;
  onUpdateName: (id: string, name: string) => void;
}

const labelClass =
  'block text-[11px] font-semibold uppercase tracking-[0.09em] text-text-label mb-2.5';

export default function SourcesTab({
  sources,
  ollamaOnline,
  onAddSource,
  onRemoveSource,
  onUpdateKey,
  onUpdateName,
}: Props) {
  const { t, f } = useI18n();
  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted leading-relaxed">
        {t.sources.intro}
      </p>

      {/* Sources connectées */}
      <div>
        <span className={labelClass}>{t.sources.connected}</span>
        <div className="space-y-2.5">
          {sources.map((source) => {
            const connected = isSourceConnected(source, ollamaOnline);
            const { name, subtitle } = localizeSource(source, t.sources);
            return (
              <div
                key={source.id}
                className="rounded-xl bg-bg-field border border-border p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: source.tint }}
                  >
                    {sourceInitial(source)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {source.editableName ? (
                      <input
                        aria-label={t.sources.nameLabel}
                        value={source.name}
                        onChange={(e) => onUpdateName(source.id, e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-text-primary border-b border-transparent hover:border-border focus:border-accent focus:outline-none transition-colors"
                      />
                    ) : (
                      <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                    )}
                    <p className="text-xs text-text-muted truncate">{subtitle}</p>
                  </div>
                  <span
                    className={`status-led ${connected ? 'status-led--on' : 'status-led--off'}`}
                    role="img"
                    aria-label={connected ? t.sources.stateConnected : t.sources.stateNotConnected}
                  />
                  {source.removable && (
                    <button
                      type="button"
                      onClick={() => onRemoveSource(source.id)}
                      aria-label={f(t.sources.remove, { name })}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-led-off hover:bg-led-off/15 transition-colors shrink-0"
                    >
                      <TrashIcon size={15} />
                    </button>
                  )}
                </div>

                {source.requiresKey && (
                  <div className="mt-3">
                    <label htmlFor={`key-${source.id}`} className="sr-only">
                      {f(t.sources.apiKeyFor, { name })}
                    </label>
                    <input
                      id={`key-${source.id}`}
                      type="password"
                      autoComplete="off"
                      value={source.apiKey || ''}
                      onChange={(e) => onUpdateKey(source.id, e.target.value)}
                      placeholder={t.sources.apiKeyPlaceholder}
                      className="w-full text-sm bg-bg-card border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-placeholder font-mono focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ajouter une source */}
      <div>
        <span className={labelClass}>{t.sources.add}</span>
        <div className="flex flex-wrap gap-2">
          {SOURCE_TEMPLATES.map((template) => localizeTemplate(template, t.sources)).map((tpl) => (
            <button
              key={tpl.kind}
              type="button"
              onClick={() => onAddSource(tpl)}
              className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg bg-bg-field border border-border hover:bg-bg-field-hover hover:border-border-strong transition-colors text-sm text-text-primary"
            >
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: tpl.tint }}
              />
              {tpl.label}
              <PlusIcon size={14} color="var(--color-text-muted)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
