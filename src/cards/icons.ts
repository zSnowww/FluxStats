// Custom line icons, viewBox 0 0 16 16, meant for `stroke` (class .icon).
export const icons = {
  star: '<path d="M8 1.8l1.9 4 4.3.5-3.2 2.9.9 4.3L8 11.3l-3.9 2.2.9-4.3-3.2-2.9 4.3-.5z"/>',
  commit: '<circle cx="8" cy="8" r="2.6"/><path d="M1.5 8h3.9M10.6 8h3.9"/>',
  pr: '<circle cx="4" cy="3.5" r="1.7"/><circle cx="4" cy="12.5" r="1.7"/><circle cx="12" cy="12.5" r="1.7"/><path d="M4 5.2v5.6M12 10.8V6.5a2 2 0 0 0-2-2H7.5M9 3L7.5 4.5 9 6"/>',
  issue: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r=".9"/>',
  fork: '<circle cx="4" cy="3.5" r="1.7"/><circle cx="12" cy="3.5" r="1.7"/><circle cx="8" cy="12.5" r="1.7"/><path d="M4 5.2v1.3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5.2M8 8.5v2.3"/>',
  repo: '<path d="M3.5 12.5V3A1.5 1.5 0 0 1 5 1.5h7.5v10H5a1.5 1.5 0 0 0 0 3h7.5"/>',
  // Contact (for badges)
  globe:
    '<circle cx="8" cy="8" r="6.2"/><path d="M1.8 8h12.4M8 1.8c1.8 1.9 2.6 3.9 2.6 6.2S9.8 12.3 8 14.2M8 1.8C6.2 3.7 5.4 5.7 5.4 8s.8 4.3 2.6 6.2"/>',
  telegram:
    '<path d="M14.5 2.2 1.8 7.1l4.1 1.5 1.6 4.9 2.3-2.6 3.3 2.5z"/><path d="M5.9 8.6 13 3.6l-5.5 6"/>',
  instagram:
    '<rect x="2" y="2" width="12" height="12" rx="3.5"/><circle cx="8" cy="8" r="2.8"/><circle cx="11.6" cy="4.4" r=".5"/>',
  mail: '<rect x="1.8" y="3.2" width="12.4" height="9.6" rx="1.5"/><path d="m2.2 4 5.8 4.6L13.8 4"/>',
  github:
    '<path d="M6 13.6c-3 .9-3-1.5-4.2-1.8M10 15.2v-2.4c0-.7.1-1.2-.3-1.6 1.9-.2 3.8-.9 3.8-4.2 0-.9-.3-1.7-.9-2.3.1-.3.4-1.2-.1-2.3 0 0-.7-.2-2.4.9a8.2 8.2 0 0 0-4.2 0C4.3 2.2 3.6 2.4 3.6 2.4c-.5 1.1-.2 2-.1 2.3-.6.6-.9 1.4-.9 2.3 0 3.3 1.9 4 3.8 4.2-.4.4-.4.8-.4 1.6v2.4"/>',
  link: '<path d="M6.6 9.4a3 3 0 0 0 4.2 0l2.2-2.2a3 3 0 0 0-4.2-4.2l-.8.8M9.4 6.6a3 3 0 0 0-4.2 0L3 8.8a3 3 0 0 0 4.2 4.2l.8-.8"/>',
  clock: '<circle cx="8" cy="8" r="6.2"/><path d="M8 4.5V8l2.4 1.6"/>',
} as const;

export type IconName = keyof typeof icons;

export const ICON_NAMES = Object.keys(icons) as [IconName, ...IconName[]];
