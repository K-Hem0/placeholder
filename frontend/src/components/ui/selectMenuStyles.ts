import { cn } from '../../lib/cn'

/** Compact utility menus (e.g. editor toolbar) — Google Docs–like density. */
export const toolbarMenuPanelClass = cn(
  'overflow-hidden rounded-sm py-0.5',
  'border border-slate-200/70 bg-white',
  'shadow-[0_1px_2px_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)]',
  'dark:border-white/[0.1] dark:bg-[#2d2e34]',
  'dark:shadow-[0_1px_3px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.35)]'
)

export function toolbarMenuItemClass(active: boolean, highlighted: boolean) {
  return cn(
    'flex w-full cursor-pointer items-center rounded-sm px-2 py-0.5 text-left text-[12px] leading-tight outline-none transition-colors duration-100',
    'min-h-[26px]',
    'focus-visible:ring-1 focus-visible:ring-slate-400/40 dark:focus-visible:ring-slate-500/35',
    highlighted &&
      !active &&
      'bg-slate-100/90 text-slate-900 dark:bg-white/[0.06] dark:text-slate-100',
    !highlighted &&
      !active &&
      'text-slate-800 hover:bg-slate-50 dark:text-slate-200/95 dark:hover:bg-white/[0.05]',
    active &&
      'bg-slate-200/70 font-medium text-slate-900 dark:bg-white/[0.1] dark:text-white'
  )
}

/** Shared surface for all custom select menus (light + dark). */
export const selectMenuPanelClass = cn(
  'overflow-hidden rounded-[14px] py-1',
  'border border-slate-200/55 bg-white/[0.92] backdrop-blur-xl backdrop-saturate-150',
  'shadow-[0_24px_64px_-20px_rgba(15,23,42,0.14),0_10px_24px_-14px_rgba(15,23,42,0.06)]',
  'ring-1 ring-slate-900/[0.02]',
  'dark:border-white/[0.07] dark:bg-[#1c1d26]/95',
  'dark:shadow-[0_28px_72px_-16px_rgba(0,0,0,0.55),0_12px_32px_-18px_rgba(0,0,0,0.38)]',
  'dark:ring-white/[0.028]'
)

export const selectMenuItemClass = (active: boolean, highlighted: boolean) =>
  cn(
    'flex w-full cursor-pointer items-center rounded-[9px] px-2.5 py-[7px] text-left text-[13px] leading-snug outline-none transition-[background,color] duration-[180ms] ease-out',
    'min-h-[2.25rem]',
    'focus-visible:ring-2 focus-visible:ring-sky-500/20 dark:focus-visible:ring-sky-400/18',
    highlighted && !active && 'bg-slate-100/75 text-slate-900 dark:bg-white/[0.045] dark:text-slate-100',
    !highlighted &&
      !active &&
      'text-slate-700/95 hover:bg-slate-100/55 dark:text-slate-300/95 dark:hover:bg-white/[0.035]',
    active &&
      'bg-slate-200/55 font-medium text-slate-900 dark:bg-white/[0.08] dark:text-slate-50'
  )

export const selectTriggerBase = cn(
  'inline-flex items-center justify-between gap-2 rounded-xl border text-left outline-none transition-all duration-150',
  'border-slate-200/85 bg-white text-slate-800 shadow-sm',
  'hover:border-slate-300/90 hover:bg-slate-50/90',
  'focus-visible:border-sky-400/50 focus-visible:ring-2 focus-visible:ring-sky-500/20',
  'dark:border-white/[0.1] dark:bg-[#1e1f28] dark:text-slate-200',
  'dark:hover:border-white/[0.14] dark:hover:bg-[#23242f]',
  'dark:focus-visible:border-sky-500/40 dark:focus-visible:ring-sky-400/15'
)
