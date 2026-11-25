import type { CurrentBuilding } from '@/domain/models';
import type { Theme } from '@/themes';
import { esc, truncate } from '@/lib/svg';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';

export function renderBuildingCard(
  data: CurrentBuilding,
  o: {
    theme: Theme;
    reposCount: number;
    hideBorder: boolean;
    animate: boolean;
  },
): string {
  const width = 450;
  const repos = data.repos.slice(0, o.reposCount);
  const firstY = HEADER_BOTTOM + 29;
  const rowHeight = 52;
  const rows = repos
    .map((repo, i) => {
      const y = firstY + i * rowHeight;
      return `<g class="row" style="animation-delay:${i * 60}ms">
      <title>${esc(repo.name)} · ${repo.commits} commits</title>
      <svg x="${PADDING}" y="${y - 15}" width="${width - PADDING * 2 - 120}" height="22" overflow="hidden"><text class="value" x="0" y="15">${esc(truncate(repo.name, 32))}</text></svg>
      <text class="small strong" x="${width - PADDING}" y="${y}" text-anchor="end">${repo.commits} commits</text>
      <svg x="${PADDING}" y="${y + 4}" width="${width - PADDING * 2}" height="20" overflow="hidden"><text class="small" x="0" y="14">${esc(truncate(repo.description ?? repo.language?.name ?? 'Public repository', 64))}</text></svg>
    </g>`;
    })
    .join('\n');
  const remainder = Math.max(0, data.total - repos.reduce((sum, r) => sum + r.commits, 0));
  const otherY = firstY + Math.max(1, repos.length) * rowHeight;
  const body = `<defs><clipPath id="building-subtitle"><rect x="${PADDING}" y="38" width="${width - PADDING * 2}" height="22"/></clipPath></defs>${rows || `<text class="label" x="${PADDING}" y="${firstY}">No public commits in this period</text>`}
    <rect x="${PADDING}" y="${otherY - 24}" width="${width - PADDING * 2}" height="1" fill="${o.theme.border}"/>
    <text class="value" x="${PADDING}" y="${otherY}">Private &amp; other work</text>
    <text class="small strong" x="${width - PADDING}" y="${otherY}" text-anchor="end">${remainder} contributions</text>
    <text class="small" x="${PADDING}" y="${otherY + 18}">Private activity, other repos, issues &amp; pull requests</text>`;
  return renderFrame({
    width,
    height: otherY + 18 + PADDING,
    title: 'Currently building',
    subtitle: `@${data.login} · Last 30 days · public repos by commits`,
    theme: o.theme,
    hideBorder: o.hideBorder,
    animate: o.animate,
    css: '.subtitle { clip-path: url(#building-subtitle) }',
    body,
  });
}
