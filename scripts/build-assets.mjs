// Renders every profile SVG in a light and a dark theme into assets/.
// Edit the data below and rerun: node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(out, { recursive: true });

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const themes = {
  dark: {
    bg: '#232A33', surface: '#2D3540', card: '#232A33', border: '#3D4652', text: '#E6EDF3', muted: '#9198A1',
    marigold: '#F2B544', onMarigold: '#1C1917', accentText: '#F2B544', mint: '#3FB950', quiet: '#7D8590',
  },
  light: {
    bg: '#F3F7F4', surface: '#FFFFFF', card: '#FFFFFF', border: '#CFE0D6', text: '#0D2B22', muted: '#4F6B5F',
    marigold: '#F2B544', onMarigold: '#0D2B22', accentText: '#8A5300', mint: '#1F8A5B', quiet: '#7C9A8C',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Rough width of system sans text; used only to size bubbles and chips.
const textWidth = (s, size, weight = 400) => s.length * size * (weight >= 600 ? 0.52 : 0.48);

function wrap(text, maxChars, maxLines, label) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > maxChars) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) throw new Error(`"${label}" wraps to ${lines.length} lines (max ${maxLines})`);
  return lines;
}

// A rounded rectangle with a chat tail at the bottom-left or bottom-right.
function bubblePath(x, y, w, h, r, tail) {
  const b = y + h;
  const left = tail === 'left';
  const right = tail === 'right';
  return [
    `M${x + r},${y}`, `H${x + w - r}`, `Q${x + w},${y} ${x + w},${y + r}`,
    right ? `V${b - 6} Q${x + w},${b + 14} ${x + w + 12},${b + 18} Q${x + w - 22},${b + 16} ${x + w - 34},${b}` : `V${b - r} Q${x + w},${b} ${x + w - r},${b}`,
    left ? `H${x + 34} Q${x + 22},${b + 16} ${x - 12},${b + 18} Q${x},${b + 14} ${x},${b - 6}` : `H${x + r} Q${x},${b} ${x},${b - r}`,
    `V${y + r}`, `Q${x},${y} ${x + r},${y}`, 'Z',
  ].join(' ');
}

function svg(width, height, title, body, style = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t">
<title id="t">${esc(title)}</title>
<style>
  text { font-family: ${FONT}; }
${style}
</style>
${body}
</svg>
`;
}

// ---------- Banner ----------
const builds = [
  ['Web apps', 'React, Next.js, Node.js and PHP'],
  ['Mobile apps', 'Flutter and Dart'],
  ['AI assistants', 'Claude API and WhatsApp'],
];

function banner(t) {
  const colX = 728;
  const rows = builds.map(([label, detail], i) => {
    const y = 120 + i * 76;
    return `<g class="row r${i}">
  <rect x="${colX}" y="${y - 17}" width="14" height="14" rx="4" fill="${t.marigold}"/>
  <text x="${colX + 30}" y="${y}" font-size="25" font-weight="700" fill="${t.text}">${esc(label)}</text>
  <text x="${colX + 30}" y="${y + 29}" font-size="19" fill="${t.muted}">${esc(detail)}</text>
</g>`;
  }).join('\n');

  const style = `
  .row { animation: rise .5s cubic-bezier(.2,.8,.2,1) both; }
  .r0 { animation-delay: .2s; } .r1 { animation-delay: .35s; } .r2 { animation-delay: .5s; }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .row { animation: none; } }`;

  const body = `<rect x="1" y="1" width="1198" height="338" rx="28" fill="${t.bg}" stroke="${t.border}" stroke-width="2"/>
<text x="64" y="158" font-size="68" font-weight="800" letter-spacing="-2" fill="${t.text}">Muhammad Fahim</text>
<text x="66" y="208" font-size="28" font-weight="500" fill="${t.muted}">Software developer in Pakistan</text>
<text x="66" y="268" font-size="22" fill="${t.text}">I build the software small businesses run on.</text>
<line x1="680" y1="80" x2="680" y2="260" stroke="${t.border}" stroke-width="2"/>
${rows}`;
  const title = `Muhammad Fahim, software developer in Pakistan. Builds ${builds.map(([l, d]) => `${l.toLowerCase()} (${d})`).join(', ')}.`;
  return svg(1200, 340, title, body, style);
}

// ---------- Project cards ----------
const projects = [
  {
    file: 'card-sister-beauty', title: 'Sister Beauty Studio', status: 'Live site', dot: 'marigold',
    text: 'Booking site for a lash and brow studio in Rome. Clients book in English or Italian; the owner runs the studio from a dashboard.',
    tech: 'React, Node.js, Express, MongoDB', cta: 'Open the live site',
  },
  {
    file: 'card-whatsapp', title: 'WhatsApp AI Assistant', status: 'Private', dot: 'quiet',
    text: "Answers a business's customers on WhatsApp in English, Urdu or Roman Urdu, captures leads, and hands chats to staff when needed.",
    tech: 'Next.js, Express, PostgreSQL, Redis, Claude API', cta: 'Demo on request',
  },
  {
    file: 'card-swapspace', title: 'SwapSpace', status: 'Live beta', dot: 'marigold',
    text: 'Campus platform where students swap books, notes and skills, with suggestions that explain why each match fits.',
    tech: 'React, TypeScript, Express, Prisma, PostgreSQL', cta: 'Open the live beta',
  },
  {
    file: 'card-edupulse', title: 'EduPulse', status: 'Public code', dot: 'mint',
    text: 'Learning management system where instructors run courses and grade work, and students submit and track progress.',
    tech: 'PHP, MySQL, Bootstrap, Docker', cta: 'View the code',
  },
];

function card(t, p) {
  const W = 600;
  const H = 316;
  const pad = 36;
  const desc = wrap(p.text, 50, 3, p.title);
  const statusW = textWidth(p.status, 19, 500);
  const body = `<path d="${bubblePath(2, 2, W - 4, H - 24, 26, 'left')}" fill="${t.card}" stroke="${t.border}" stroke-width="1.5" stroke-linejoin="round" transform="translate(12 0)"/>
<g transform="translate(12 0)">
  <text x="${pad}" y="68" font-size="31" font-weight="700" letter-spacing="-.5" fill="${t.text}">${esc(p.title)}</text>
  <circle cx="${W - pad - statusW - 14}" cy="61" r="6" fill="${t[p.dot]}"/>
  <text x="${W - pad}" y="68" text-anchor="end" font-size="19" font-weight="500" fill="${t.muted}">${esc(p.status)}</text>
  <text x="${pad}" y="102" font-size="18" fill="${t.muted}">${esc(p.tech)}</text>
  ${desc.map((l, i) => `<text x="${pad}" y="${150 + i * 32}" font-size="22" fill="${t.text}">${esc(l)}</text>`).join('\n  ')}
  <text x="${W - pad}" y="${H - 60}" text-anchor="end" font-size="18" font-weight="600" fill="${t.accentText}">${esc(p.cta)}</text>
</g>`;
  if (textWidth(p.tech, 18) > W - pad * 2) throw new Error(`"${p.title}" tech line is too long`);
  if (textWidth(p.title, 31, 700) + statusW + 40 > W - pad * 2) throw new Error(`"${p.title}" title collides with its status`);
  return svg(W + 16, H, `${p.title} (${p.status}). ${p.text} Built with ${p.tech}.`, body);
}

let count = 0;
for (const [name, t] of Object.entries(themes)) {
  writeFileSync(join(out, `banner-${name}.svg`), banner(t));
  for (const p of projects) writeFileSync(join(out, `${p.file}-${name}.svg`), card(t, p));
  count += 1 + projects.length;
}
console.log(`Wrote ${count} SVGs to assets/`);
