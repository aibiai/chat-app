declare module 'chinese-conv' {
  export function sify(input: string): string; // 繁体 -> 简体
  export function tify(input: string): string; // 简体 -> 繁体
}
