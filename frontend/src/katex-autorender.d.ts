declare module 'katex/contrib/auto-render' {
  export interface RenderMathInElementOptions {
    delimiters?: { left: string; right: string; display: boolean }[]
    throwOnError?: boolean
    strict?: string
  }
  export default function renderMathInElement(
    el: HTMLElement,
    options?: RenderMathInElementOptions
  ): void
}
