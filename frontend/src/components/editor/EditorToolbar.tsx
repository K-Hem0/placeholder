import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { promptAndSetLink } from '../../lib/promptLinkEditor'
import type { SelectMenuOption } from '../ui/SelectMenu'
import { ToolbarButton } from './toolbar/ToolbarButton'
import { ToolbarSelect } from './toolbar/ToolbarSelect'

const STYLE_OPTIONS: SelectMenuOption[] = [
  {
    value: 'paragraph',
    label: 'Normal text',
    group: 'Text',
    icon: <IconText />,
  },
  {
    value: 'h1',
    label: 'Heading 1',
    group: 'Text',
    icon: <IconH1 />,
  },
  {
    value: 'h2',
    label: 'Heading 2',
    group: 'Text',
    icon: <IconH2 />,
  },
  {
    value: 'h3',
    label: 'Heading 3',
    group: 'Text',
    icon: <IconH3 />,
  },
  {
    value: 'bulletList',
    label: 'Bulleted list',
    group: 'Lists',
    icon: <IconBulletList />,
  },
  {
    value: 'orderedList',
    label: 'Numbered list',
    group: 'Lists',
    icon: <IconOrderedList />,
  },
  {
    value: 'blockquote',
    label: 'Quote',
    group: 'Blocks',
    icon: <IconQuote />,
  },
  {
    value: 'codeBlock',
    label: 'Code block',
    group: 'Blocks',
    icon: <IconCodeBlock />,
  },
  {
    value: 'horizontalRule',
    label: 'Divider',
    group: 'Blocks',
    icon: <IconDivider />,
  },
]

const FONT_SIZE_OPTIONS: SelectMenuOption[] = [
  { value: '', label: 'Size' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
]

type BlockStyle =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'

function getBlockStyle(editor: Editor): BlockStyle {
  if (editor.isActive('horizontalRule')) return 'horizontalRule'
  if (editor.isActive('codeBlock')) return 'codeBlock'
  if (editor.isActive('blockquote')) return 'blockquote'
  if (editor.isActive('bulletList')) return 'bulletList'
  if (editor.isActive('orderedList')) return 'orderedList'
  if (editor.isActive('heading', { level: 1 })) return 'h1'
  if (editor.isActive('heading', { level: 2 })) return 'h2'
  if (editor.isActive('heading', { level: 3 })) return 'h3'
  return 'paragraph'
}

function getParagraphAlign(editor: Editor): string {
  return (
    editor.getAttributes('paragraph').textAlign ??
    editor.getAttributes('heading').textAlign ??
    'left'
  )
}

function getFontSize(editor: Editor): string {
  const raw = editor.getAttributes('textStyle').fontSize
  return typeof raw === 'string' ? raw : ''
}

function applyBlockStyle(editor: Editor, style: BlockStyle) {
  let chain = editor.chain().focus()
  if (style === 'paragraph') {
    if (editor.isActive('horizontalRule')) {
      editor.chain().focus().deleteCurrentNode().run()
      return
    }
    if (editor.isActive('bulletList')) chain = chain.toggleBulletList()
    if (editor.isActive('orderedList')) chain = chain.toggleOrderedList()
    if (editor.isActive('blockquote')) chain = chain.toggleBlockquote()
    if (editor.isActive('codeBlock')) chain = chain.toggleCodeBlock()
    chain.setParagraph().run()
    return
  }
  switch (style) {
    case 'h1':
      chain.toggleHeading({ level: 1 }).run()
      break
    case 'h2':
      chain.toggleHeading({ level: 2 }).run()
      break
    case 'h3':
      chain.toggleHeading({ level: 3 }).run()
      break
    case 'bulletList':
      chain.toggleBulletList().run()
      break
    case 'orderedList':
      chain.toggleOrderedList().run()
      break
    case 'blockquote':
      chain.toggleBlockquote().run()
      break
    case 'codeBlock':
      chain.toggleCodeBlock().run()
      break
    case 'horizontalRule':
      editor.chain().focus().setHorizontalRule().run()
      break
  }
}

function ToolbarGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-px rounded-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

function ToolbarSep() {
  return (
    <div
      className="mx-0.5 h-4 w-px shrink-0 self-center bg-slate-200/55 dark:bg-white/[0.07]"
      aria-hidden
    />
  )
}

function ToolbarRightSep() {
  return (
    <div
      className="mx-1 h-5 w-px shrink-0 self-center bg-slate-200/50 dark:bg-white/[0.08]"
      aria-hidden
    />
  )
}

type EditorToolbarProps = {
  editor: Editor
  className?: string
  /** Secondary actions on the right (e.g. Focus). Undo/redo stay left of this. */
  rightSlot?: ReactNode
}

export function EditorToolbar({ editor, className, rightSlot }: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      blockStyle: getBlockStyle(ed),
      align: getParagraphAlign(ed),
      fontSize: getFontSize(ed),
      isBold: ed.isActive('bold'),
      isItalic: ed.isActive('italic'),
      isUnderline: ed.isActive('underline'),
      isStrike: ed.isActive('strike'),
      isCode: ed.isActive('code'),
      isLink: ed.isActive('link'),
      canUndo: ed.can().undo(),
      canRedo: ed.can().redo(),
    }),
  })

  const onFontSize = (value: string) => {
    const chain = editor.chain().focus()
    if (!value) chain.unsetFontSize().run()
    else chain.setFontSize(value).run()
  }

  const onLink = () => promptAndSetLink(editor)

  return (
    <div
      className={cn(
        'flex w-full min-h-8 items-center justify-between gap-3',
        className
      )}
    >
      <div
        className={cn(
          'flex min-h-8 min-w-0 flex-1 items-center gap-x-1.5 overflow-x-auto py-0.5 pl-0 pr-1',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        <ToolbarGroup>
          <ToolbarSelect
            label="Text style"
            title="Styles"
            value={state.blockStyle}
            onChange={(v) => applyBlockStyle(editor, v as BlockStyle)}
            options={STYLE_OPTIONS}
          />
          <ToolbarSelect
            label="Font size"
            title="Font size"
            narrow
            value={
              FONT_SIZE_OPTIONS.some((o) => o.value === state.fontSize)
                ? state.fontSize
                : ''
            }
            onChange={(v) => onFontSize(v)}
            options={FONT_SIZE_OPTIONS}
          />
        </ToolbarGroup>

        <ToolbarSep />

        <ToolbarGroup>
          <ToolbarButton
            title="Bold (Ctrl+B)"
            active={state.isBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="text-[12px] font-semibold">B</span>
          </ToolbarButton>
          <ToolbarButton
            title="Italic (Ctrl+I)"
            active={state.isItalic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="text-[12px] italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            title="Underline (Ctrl+U)"
            active={state.isUnderline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="text-[12px] underline underline-offset-2">U</span>
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={state.isStrike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <span className="text-[11px] line-through">S</span>
          </ToolbarButton>
          <ToolbarButton
            title="Inline code"
            active={state.isCode}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <span className="font-mono text-[10px] leading-none">&lt;/&gt;</span>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSep />

        <ToolbarGroup>
          <ToolbarButton
            title="Align left"
            active={state.align === 'left'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeftIcon />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={state.align === 'center'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenterIcon />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={state.align === 'right'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRightIcon />
          </ToolbarButton>
          <ToolbarButton
            title="Justify"
            active={state.align === 'justify'}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <AlignJustifyIcon />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSep />

        <ToolbarGroup>
          <ToolbarButton title="Link" active={state.isLink} onClick={onLink}>
            <LinkIcon />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 pl-0.5">
        <ToolbarButton
          title="Undo"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RedoIcon />
        </ToolbarButton>
        {rightSlot ? (
          <>
            <ToolbarRightSep />
            {rightSlot}
          </>
        ) : null}
      </div>
    </div>
  )
}

function iconClass() {
  return 'h-3 w-3'
}

function AlignLeftIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
    </svg>
  )
}

function AlignCenterIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M4 6h16M7 12h10M5 18h14" strokeLinecap="round" />
    </svg>
  )
}

function AlignRightIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M4 6h16M10 12h10M6 18h14" strokeLinecap="round" />
    </svg>
  )
}

function AlignJustifyIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        d="M9 14 4 9l5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        d="m15 14 5-5-5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      className={iconClass()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </svg>
  )
}

function menuIconClass() {
  return 'h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400'
}

function IconText() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M9 17h6M10 7v10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconH1() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6v12M6 12h6M14 10h6l-2 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconH2() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6v12M5 12h5M13 9h7M15 9v9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconH3() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6v12M5 12h5M13 8h6M15 8v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBulletList() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 7h10M9 12h10M9 17h10M6 7h.01M6 12h.01M6 17h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconOrderedList() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h11M8 12h11M8 17h11M5 7v1M5 12v1M5 17v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconQuote() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 9h5v6H8l-1.5-3L8 9Zm7 0h5v6h-5l-1.5-3L15 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCodeBlock() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m8 9-3 3 3 3m8-6 3 3-3 3M14 6l-2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconDivider() {
  return (
    <svg className={menuIconClass()} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M5 7h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  )
}
