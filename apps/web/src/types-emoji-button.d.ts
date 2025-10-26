declare module 'emoji-button' {
  export class EmojiButton {
    constructor(options?: any)
    togglePicker(anchor?: HTMLElement): void
    on(event: 'emoji', handler: (selection: { emoji: string }) => void): void
  }
  export default EmojiButton
}
