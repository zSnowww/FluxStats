import type { Theme } from '@/themes';
import { esc, truncate } from '@/lib/svg';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';

export function renderErrorCard(message: string, theme: Theme): string {
  return renderFrame({
    width: 450,
    height: HEADER_BOTTOM + 52,
    title: 'Could not render card',
    subtitle: 'FluxStats',
    theme,
    hideBorder: false,
    animate: false,
    body: `<text class="label" x="${PADDING}" y="${HEADER_BOTTOM + 30}">${esc(truncate(message, 58))}</text>`,
  });
}
