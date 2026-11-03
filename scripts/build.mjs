// SPDX-License-Identifier: AGPL-3.0-only
// Generates the blueprint SVGs of the profile README (dark and light), with no dependencies.
// Run: node scripts/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(out, { recursive: true });

/** Same palette as baxyz.dev: blueprint (dark) and paper (light). */
const themes = {
  dark: { desk: '#091a3a', paper: '#0d2a5c', ink: '#e8f1ff', ink2: '#8fb4ff', red: '#ffb454', ok: '#7ee7a8', grid: 'rgba(143,180,255,0.15)', card: 'rgba(255,255,255,0.05)' },
  light: { desk: '#d9d3c1', paper: '#f3f0e6', ink: '#16367d', ink2: '#3b5bb5', red: '#c2410c', ok: '#15803d', grid: 'rgba(22,54,125,0.1)', card: 'rgba(255,255,255,0.55)' },
};

const SANS = "'IBM Plex Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const rev = new Date().toISOString().slice(0, 7).replace('-', '.');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Greedy word wrap on a character budget (monospace, so characters ≈ width). */
function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

const svg = (w, h, title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">\n<title>${esc(title)}</title>\n${body}\n</svg>\n`;

/** Drafting grid pattern, 20 px cells. */
const gridDefs = (t, id) =>
  `<defs><pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${t.grid}" stroke-width="1"/></pattern></defs>`;

/** Rulers along the top and left edges, like the desk of baxyz.dev. */
function rulers(t, w, h, size = 14) {
  let s = `<rect width="${w}" height="${size}" fill="${t.desk}"/><rect width="${size}" height="${h}" fill="${t.desk}"/>`;
  for (let x = size; x < w; x += 10) {
    const major = (x - size) % 100 === 0;
    s += `<line x1="${x}" y1="${size}" x2="${x}" y2="${size - (major ? 10 : (x - size) % 50 === 0 ? 7 : 4)}" stroke="${t.ink2}" stroke-width="1"/>`;
    if (major && x > size) s += `<text x="${x + 2}" y="8" font-family="${MONO}" font-size="7" fill="${t.ink2}">${(x - size) / 10}</text>`;
  }
  for (let y = size; y < h; y += 10) {
    const major = (y - size) % 100 === 0;
    s += `<line x1="${size}" y1="${y}" x2="${size - (major ? 10 : (y - size) % 50 === 0 ? 7 : 4)}" y2="${y}" stroke="${t.ink2}" stroke-width="1"/>`;
  }
  return s;
}

/** A sheet on the desk: grid, double border. Returns the inner box. */
function sheet(t, w, h, id, { ruler = true, m = 14 } = {}) {
  const x = ruler ? 14 + m : m;
  const y = ruler ? 14 + m : m;
  const sw = w - x - m;
  const sh = h - y - m;
  const body =
    gridDefs(t, id) +
    `<rect width="${w}" height="${h}" fill="${t.desk}"/>` +
    (ruler ? rulers(t, w, h) : '') +
    `<rect x="${x}" y="${y}" width="${sw}" height="${sh}" fill="${t.paper}"/>` +
    `<rect x="${x}" y="${y}" width="${sw}" height="${sh}" fill="url(#${id})"/>` +
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${sw - 1}" height="${sh - 1}" fill="none" stroke="${t.ink2}" stroke-width="1"/>` +
    `<rect x="${x + 6.5}" y="${y + 6.5}" width="${sw - 13}" height="${sh - 13}" fill="none" stroke="${t.ink}" stroke-width="1.5"/>`;
  return { body, x: x + 7, y: y + 7, w: sw - 14, h: sh - 14 };
}

/** Horizontal dimension line with arrow heads and a centred label. */
function dimension(t, x1, x2, y, label) {
  const mid = (x1 + x2) / 2;
  const half = label.length * 3.6 + 8;
  return (
    `<g stroke="${t.ink2}" stroke-width="1" fill="none">` +
    `<line x1="${x1}" y1="${y - 6}" x2="${x1}" y2="${y + 6}"/><line x1="${x2}" y1="${y - 6}" x2="${x2}" y2="${y + 6}"/>` +
    `<line x1="${x1}" y1="${y}" x2="${mid - half}" y2="${y}"/><line x1="${mid + half}" y1="${y}" x2="${x2}" y2="${y}"/>` +
    `<path d="M${x1 + 7} ${y - 3}L${x1} ${y}L${x1 + 7} ${y + 3}"/><path d="M${x2 - 7} ${y - 3}L${x2} ${y}L${x2 - 7} ${y + 3}"/></g>` +
    `<text x="${mid}" y="${y + 4}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.ink2}">${esc(label)}</text>`
  );
}

/** Title block cells: [{label, value, w, accent?}], drawn right-aligned at (right, y). */
function titleBlock(t, right, y, cells, h = 46) {
  const total = cells.reduce((n, c) => n + c.w, 0);
  let x = right - total;
  let s = `<rect x="${x}" y="${y}" width="${total}" height="${h}" fill="${t.paper}" stroke="${t.ink}" stroke-width="1.5"/>`;
  for (const [i, c] of cells.entries()) {
    if (i > 0) s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${t.ink}" stroke-width="1"/>`;
    s += `<text x="${x + 10}" y="${y + 16}" font-family="${MONO}" font-size="9" letter-spacing="1.5" fill="${t.ink2}">${esc(c.label.toUpperCase())}</text>`;
    s += `<text x="${x + 10}" y="${y + 36}" font-family="${MONO}" font-size="15" font-weight="700" fill="${c.accent ? t.red : t.ink}">${esc(c.value)}</text>`;
    x += c.w;
  }
  return s;
}

// ── Header ────────────────────────────────────────────────────────────────

function header(t, id) {
  const W = 1000;
  const H = 350;
  const s = sheet(t, W, H, id);
  const L = s.x + 30;
  const R = s.x + s.w - 24;
  let b = s.body;

  // Sheet head: title on the left, revision box on the right.
  b += `<text x="${L}" y="${s.y + 82}" font-family="${SANS}" font-size="64" font-weight="700" letter-spacing="3" fill="${t.ink}">BAXYZ</text>`;
  b += `<text x="${L + 4}" y="${s.y + 112}" font-family="${MONO}" font-size="16" fill="${t.ink2}">Code &amp; Design</text>`;
  b += `<text x="${L + 4}" y="${s.y + 133}" font-family="${MONO}" font-size="16" fill="${t.ink2}">with panache</text>`;

  const rx = R - 150;
  b += `<rect x="${rx}" y="${s.y + 30}" width="150" height="70" fill="none" stroke="${t.ink2}" stroke-width="1"/>`;
  ['REV ' + rev, 'DRAWN: B.', 'SCALE 1:1'].forEach((line, i) => {
    b += `<text x="${rx + 12}" y="${s.y + 52 + i * 19}" font-family="${MONO}" font-size="13" ${i === 0 ? 'font-weight="700" ' : ''}fill="${t.ink}">${esc(line)}</text>`;
  });

  // Rule + kicker.
  b += `<line x1="${L}" y1="${s.y + 156}" x2="${R}" y2="${s.y + 156}" stroke="${t.ink}" stroke-width="1.5"/>`;
  b += `<text x="${L}" y="${s.y + 178}" font-family="${MONO}" font-size="12" letter-spacing="2" fill="${t.ink2}">OPEN-SOURCE TOOLING · SPECIFICATION SHEET · BY BÉRENGER</text>`;

  // Scope line.
  // Kept under ~45 characters per line so a wide monospace font stays clear of the title block.
  b += `<text x="${L}" y="${s.y + 210}" font-family="${MONO}" font-size="15" fill="${t.ink}">Developer tools built to be <tspan font-weight="700">typed</tspan>,</text>`;
  b += `<text x="${L}" y="${s.y + 231}" font-family="${MONO}" font-size="15" fill="${t.ink}"><tspan font-weight="700">tested</tspan> and <tspan font-weight="700">documented</tspan> for humans and</text>`;
  b += `<text x="${L}" y="${s.y + 252}" font-family="${MONO}" font-size="15" fill="${t.ink}">machines, shipped in the open.</text>`;

  b += dimension(t, L, L + 440, s.y + 284, 'TypeScript · Rust · DevContainers · Linux');

  // Title block, bottom right, pointing to the full drawing set.
  b += titleBlock(t, R, s.y + s.h - 62, [
    { label: 'Drawing', value: 'BAXYZ-GH', w: 120 },
    { label: 'Based in', value: 'Montpellier', w: 140 },
    { label: 'Full set', value: 'baxyz.dev →', w: 150, accent: true },
  ]);

  return svg(W, H, 'baxyz — Code & Design with panache. Open-source tooling by Bérenger. Full drawing set at baxyz.dev', b);
}

// ── Project cards ─────────────────────────────────────────────────────────

const flagships = [
  {
    slug: 'helpers4',
    title: 'helpers4',
    drawing: 'BAXYZ-110',
    status: 'stable',
    tagline: 'The everyday building blocks of a project, in TypeScript and Rust, with the tooling around them.',
    stack: ['TypeScript', 'Rust', 'DevContainer', 'Actions'],
  },
  {
    slug: 'tuxery',
    title: 'Tuxery',
    drawing: 'BAXYZ-120',
    status: 'active',
    tagline: 'A unified Linux app store: one card per app, whatever the source.',
    stack: ['Qwik', 'TypeScript', 'Linux'],
  },
  {
    slug: 'brig-id',
    title: 'brig·id',
    drawing: 'BAXYZ-130',
    status: 'early',
    tagline: 'Self-hosted identity, done properly: passkeys, OIDC and post-quantum cryptography.',
    stack: ['Rust', 'Qwik', 'WebAuthn', 'OIDC'],
  },
  {
    slug: 'feature-today',
    title: 'Feature Today',
    drawing: 'BAXYZ-140',
    status: 'dev',
    tagline: 'Finding and resolving the frustration points of digital products.',
    stack: ['Qwik', 'TypeScript'],
  },
];

const statusLabel = { stable: 'STABLE', active: 'ACTIVE DEV', early: 'EARLY STAGE', dev: 'IN DEVELOPMENT' };

function card(t, f, id) {
  const W = 480;
  const H = 210;
  const s = sheet(t, W, H, id, { ruler: false, m: 6 });
  const L = s.x + 16;
  const R = s.x + s.w - 16;
  let b = s.body;

  b += `<text x="${L}" y="${s.y + 22}" font-family="${MONO}" font-size="10" letter-spacing="1.5" fill="${t.ink2}">${f.drawing}</text>`;
  b += `<text x="${L}" y="${s.y + 52}" font-family="${SANS}" font-size="26" font-weight="700" fill="${t.ink}">${esc(f.title)}</text>`;

  const color = f.status === 'stable' ? t.ok : f.status === 'early' ? t.red : t.ink2;
  const label = statusLabel[f.status];
  const pw = label.length * 7 + 18;
  b += `<rect x="${R - pw}" y="${s.y + 12}" width="${pw}" height="20" rx="10" fill="none" stroke="${color}" stroke-width="1.2"${f.status === 'dev' ? ' stroke-dasharray="3 3"' : ''}/>`;
  b += `<text x="${R - pw / 2}" y="${s.y + 26}" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="700" letter-spacing="0.5" fill="${color}">${label}</text>`;

  wrap(f.tagline, 52).forEach((line, i) => {
    b += `<text x="${L}" y="${s.y + 80 + i * 19}" font-family="${MONO}" font-size="13" fill="${t.ink}">${esc(line)}</text>`;
  });

  let tx = L;
  for (const tag of f.stack) {
    const tw = tag.length * 6.6 + 14;
    b += `<rect x="${tx}" y="${s.y + s.h - 58}" width="${tw}" height="20" fill="${t.card}" stroke="${t.ink2}" stroke-width="1"/>`;
    b += `<text x="${tx + 7}" y="${s.y + s.h - 44}" font-family="${MONO}" font-size="11" fill="${t.ink2}">${esc(tag)}</text>`;
    tx += tw + 6;
  }

  b += `<line x1="${L}" y1="${s.y + s.h - 28}" x2="${R}" y2="${s.y + s.h - 28}" stroke="${t.ink2}" stroke-width="1" stroke-dasharray="2 3"/>`;
  b += `<text x="${L}" y="${s.y + s.h - 10}" font-family="${MONO}" font-size="12" fill="${t.ink2}">baxyz.dev/projects/${f.slug}</text>`;
  b += `<text x="${R}" y="${s.y + s.h - 10}" text-anchor="end" font-family="${MONO}" font-size="12" font-weight="700" fill="${t.red}">Open the sheet →</text>`;

  return svg(W, H, `${f.title} — ${f.tagline} Open the sheet on baxyz.dev`, b);
}

// ── Footer title block ────────────────────────────────────────────────────

function footer(t, id) {
  const W = 1000;
  const H = 130;
  const s = sheet(t, W, H, id, { ruler: false, m: 8 });
  const L = s.x + 22;
  const R = s.x + s.w - 22;
  let b = s.body;

  b += `<text x="${L}" y="${s.y + 36}" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${t.ink2}">THIS PAGE IS A SINGLE SHEET.</text>`;
  b += `<text x="${L}" y="${s.y + 70}" font-family="${SANS}" font-size="30" font-weight="700" fill="${t.ink}">The full drawing set lives at <tspan fill="${t.red}">baxyz.dev</tspan></text>`;
  b += `<text x="${L}" y="${s.y + 94}" font-family="${MONO}" font-size="12" fill="${t.ink2}">projects · ecosystem · issues to pick up · weekly tech watch · contact</text>`;

  b += titleBlock(t, R, s.y + 26, [
    { label: 'Sheet', value: '1 / 1', w: 90 },
    { label: 'Open', value: '→', w: 64, accent: true },
  ], 56);

  return svg(W, H, 'The full drawing set lives at baxyz.dev', b);
}

// ── Write everything ──────────────────────────────────────────────────────

const write = (name, content) => writeFileSync(join(out, name), content);

for (const [mode, t] of Object.entries(themes)) {
  write(`header-${mode}.svg`, header(t, `g-h-${mode}`));
  write(`footer-${mode}.svg`, footer(t, `g-f-${mode}`));
  for (const f of flagships) write(`card-${f.slug}-${mode}.svg`, card(t, f, `g-${f.slug}-${mode}`));
}
console.log(`assets written to ${out}`);
