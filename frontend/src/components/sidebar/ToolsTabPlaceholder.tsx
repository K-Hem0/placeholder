/**
 * Extension point: AI assistant / Wolfram / utilities — implement
 * `WritingAssistantPanelProps` or add new tab entries in `Sidebar.tsx`.
 */
export function ToolsTabPlaceholder() {
  return (
    <div className="max-w-full min-w-0 rounded-xl border border-dashed border-slate-200/60 bg-white/20 px-3 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="text-[12px] font-medium text-slate-600 dark:text-slate-500/90">
        Tools
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-600/85">
        Writing tools and assistants will connect here.
      </p>
    </div>
  )
}
