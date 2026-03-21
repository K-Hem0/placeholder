/** Placeholder until writing tools / assistants are wired in. */
export function ToolsTabPlaceholder() {
  return (
    <div className="max-w-full min-w-0 rounded-xl border border-dashed border-slate-200/55 bg-slate-50/50 px-4 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="text-[12px] font-medium tracking-tight text-slate-600 dark:text-slate-500/90">
        Tools
      </p>
      <p className="mx-auto mt-3 max-w-full min-w-0 text-pretty text-[11px] leading-relaxed text-slate-500 dark:text-slate-600/85">
        Writing tools and assistants will connect here.
      </p>
    </div>
  )
}
