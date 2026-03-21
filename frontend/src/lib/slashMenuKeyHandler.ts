/** Set by SlashCommandMenu; read by slash command extension `onKeyDown`. */
export const slashMenuKeyHandlerRef = {
  current: null as ((event: KeyboardEvent) => boolean) | null,
}
