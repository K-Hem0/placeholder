/**
 * Extension point: swap this panel for a Literature discovery UI implementing
 * `LiteraturePanelProps` from `src/types/integrations.ts`.
 */
export function LiteratureTabPlaceholder() {
  return (
    <div className="max-w-full min-w-0 rounded-xl border border-dashed border-slate-200/60 bg-white/20 px-3 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="text-[12px] font-medium text-slate-600 dark:text-slate-500/90">
        Literature
      </p>
      <p className="mt-2 break-words text-[11px] leading-relaxed text-slate-500 dark:text-slate-600/85">
        Discovery and references will plug in here. See{' '}
        <code className="inline-block max-w-full break-all rounded bg-slate-100/80 px-1 py-0.5 align-baseline font-mono text-[10px] [overflow-wrap:anywhere] dark:bg-white/[0.06]">
          types/integrations.ts
        </code>
        .
      </p>
    </div>
  )
}
