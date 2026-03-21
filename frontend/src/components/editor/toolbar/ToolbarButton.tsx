import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../lib/cn'

type ToolbarButtonProps = {
  active?: boolean
  children: ReactNode
  title?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>

export function ToolbarButton({
  active,
  className,
  children,
  disabled,
  ...rest
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-[5px] px-1 text-[12px] transition-colors duration-100 ease-out',
        'text-slate-600/90 hover:bg-slate-200/45 hover:text-slate-900',
        'active:bg-slate-200/58 dark:active:bg-white/[0.09]',
        'dark:text-slate-400/90 dark:hover:bg-white/[0.07] dark:hover:text-slate-100',
        active &&
          'bg-slate-200/50 text-slate-900 dark:bg-white/[0.09] dark:text-slate-100',
        disabled &&
          'cursor-not-allowed opacity-35 hover:bg-transparent active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
