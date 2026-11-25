// Validates README.md and assets/ before previewing or publishing.
// Usage: node scripts/check.mjs   (ALLOW_EMAIL=1 permits an email address)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Live widgets are allowed only from these services; everything else is local.
const WIDGET_HOSTS = ['skillicons.dev', 'streak-stats.demolab.com', 'github-readme-activity-graph.vercel.app'];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (message) => failures.push(message);

const readmePath = join(root, 'README.md');
if (!existsSync(readmePath)) {
  console.error('FAIL: README.md missing');
  process.exit(1);
}
const readme = readFileSync(readmePath, 'utf8');

async function fetchStatus(url, init) {
  let response = await fetch(url, { redirect: 'follow', ...init });
  if (response.status >= 400 && init?.method === 'HEAD') response = await fetch(url, { redirect: 'follow' });
  return response;
}

// Local images must exist; remote images must come from an allowed widget and return an SVG.
const sources = [...readme.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]);
if (sources.length === 0) fail('README has no images');
for (const src of sources) {
  if (/^https?:/i.test(src)) {
    const host = new URL(src).hostname;
    if (!WIDGET_HOSTS.includes(host)) { fail(`image from a host that is not allowed: ${host}`); continue; }
    try {
      const response = await fetchStatus(src);
      const type = response.headers.get('content-type') || '';
      if (response.status !== 200 || !type.includes('image/svg')) fail(`widget ${host} returned ${response.status} ${type}`);
    } catch (error) {
      fail(`widget ${host} failed: ${error.message}`);
    }
  } else if (!existsSync(join(root, src))) {
    fail(`missing image: ${src}`);
  }
}

// A raw comma inside srcset splits the URL (GitHub's image proxy then truncates it).
for (const [, url] of readme.matchAll(/srcset="([^"]+)"/g)) {
  if (url.includes(',')) fail(`srcset URL contains a raw comma (use %2C): ${url.slice(0, 70)}…`);
}

// Every <picture> needs a dark source and a different light fallback with alt text.
for (const [block] of readme.matchAll(/<picture>[\s\S]*?<\/picture>/g)) {
  const dark = block.match(/media="\(prefers-color-scheme: dark\)"\s+srcset="([^"]+)"/)?.[1];
  const light = block.match(/<img[^>]+src="([^"]+)"/)?.[1];
  const label = block.slice(0, 90).replace(/\s+/g, ' ');
  if (!dark || !light || dark === light) fail(`picture without distinct dark and light images: ${label}…`);
  if (!/<img[^>]+alt="[^"]{12,}"/.test(block)) fail(`picture without descriptive alt text: ${label}…`);
}

// Every local SVG must be well-formed XML (a malformed one shows as a broken image).
for (const file of readdirSync(join(root, 'assets')).filter((f) => f.endsWith('.svg'))) {
  try {
    execFileSync('xmllint', ['--noout', join(root, 'assets', file)], { stdio: 'pipe' });
  } catch (error) {
    fail(`invalid SVG ${file}: ${String(error.stderr).trim()}`);
  }
}

// No email address unless the owner approved publishing it.
if (!process.env.ALLOW_EMAIL && /[\w.+-]+@[\w-]+\.[\w.]+/.test(readme)) fail('README contains an email address');

// Every external link must resolve.
const links = [...new Set([...readme.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]))];
for (const url of links) {
  try {
    const response = await fetchStatus(url, { method: 'HEAD' });
    if (response.status >= 400) fail(`link ${url} returned ${response.status}`);
  } catch (error) {
    fail(`link ${url} failed: ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.map((f) => `FAIL: ${f}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${sources.length} image sources (${sources.filter((s) => /^https?:/.test(s)).length} live widgets), ${links.length} links, all SVGs valid`);
