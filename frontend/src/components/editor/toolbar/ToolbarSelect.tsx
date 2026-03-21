import { SelectMenu, type SelectMenuOption } from '../../ui/SelectMenu'
import { cn } from '../../../lib/cn'

type ToolbarSelectProps = {
  label: string
  title?: string
  options: SelectMenuOption[]
  value: string
  onChange: (value: string) => void
  narrow?: boolean
  searchable?: boolean
  compact?: boolean
}

export function ToolbarSelect({
  label,
  title,
  options,
  value,
  onChange,
  narrow,
  searchable = false,
  compact = true,
}: ToolbarSelectProps) {
  return (
    <SelectMenu
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={title ?? label}
      variant="toolbar"
      searchable={searchable}
      compact={compact}
      menuMinWidthTrigger={!searchable}
      className={cn(
        narrow ? 'max-w-[3.25rem]' : 'max-w-[9.5rem]'
      )}
    />
  )
}
