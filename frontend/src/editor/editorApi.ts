/**
 * Editor API — handoff for teammates integrating with the writing surface.
 *
 * The live editor is TipTap (`@tiptap/react`) configured in:
 * - `src/lib/tiptapExtensions.ts` — extension list (StarterKit, alignment, wiki links, …)
 * - `src/components/editor/EditorPane.tsx` — instance, persistence to the Zustand store
 *
 * Content shape: HTML string stored on `Note.content` (see `src/types/index.ts`).
 *
 * To add a new mark or node:
 * 1. Create an extension file under `src/lib/` (see `wikiLinkExtension.ts`).
 * 2. Append it from `createEditorExtensions()`.
 * 3. If persistence needs new attributes, extend the storage schema in `src/lib/schema.ts`.
 *
 * External panels (right sidebar) should not reach into the editor directly; prefer props/callbacks
 * passed from `App` later, or a small event bus if the app grows.
 */

export {}
