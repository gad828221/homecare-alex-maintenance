import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

// Isolated, locked build-only packages do not change the app's dependencies.
execFileSync('npm', ['ci', '--prefix', 'scripts/prerender', '--ignore-scripts', '--no-audit', '--no-fund'], { stdio: 'inherit' });
const require = createRequire(new URL('./prerender/package.json', import.meta.url));
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Render the built public app in an isolated, signed-out browser. No production
// services are contacted, and an incomplete render fails the deployment.
const dist = path.resolve('dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
if (routes.length !== 19 || new Set(routes).size !== 19) throw new Error('Unexpected public route list');
fs.writeFileSync(path.join(dist, 'spa.html'), template);
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(dist, '.' + pathname);
  if (!file.startsWith(dist + path.sep) && file !== dist) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } else {
    res.setHeader('Content-Type', 'text/html');
    // Always use the untouched shell, never a previously generated snapshot.
    res.end(template);
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
try {
  const systemChrome = process.env.CI ? undefined : ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
  browser = await puppeteer.launch({ executablePath: systemChrome || await chromium.executablePath(), args: systemChrome ? ['--no-sandbox', '--disable-dev-shm-usage'] : chromium.args, headless: systemChrome ? true : 'shell' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    // No analytics, Maps embeds, push, account APIs, or external writes at build time.
    if (!req.url().startsWith(origin + '/') || !['GET', 'HEAD'].includes(req.method())) req.abort();
    else req.continue();
  });
  for (const route of routes) {
    await page.goto(origin + route, { waitUntil: 'networkidle0', timeout: 45000 });
    await page.waitForSelector('#root h1', { timeout: 20000 });
    if (route !== '/service-areas') await page.waitForSelector('#root input, #root select', { timeout: 20000 });
    const snapshot = await page.evaluate(() => {
      const root = document.getElementById('root').cloneNode(true);
      // Scroll-reveal animations must not hide content when JS is unavailable.
      root.querySelectorAll('[style]').forEach((el) => {
        if (el.style.opacity === '0' && el.style.transform) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      const metas = [...document.head.querySelectorAll('meta[name],meta[property]')].map((el) => ({ key: el.hasAttribute('name') ? 'name' : 'property', name: el.getAttribute('name') || el.getAttribute('property'), content: el.getAttribute('content') }));
      const schemas = [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((el) => JSON.parse(el.textContent));
      return { root: root.outerHTML, title: document.title, metas, schemas, canonical: document.querySelector('link[rel="canonical"]').href, words: root.textContent.trim().split(/\s+/).length, links: root.querySelectorAll('a[href]').length };
    });
    const canonical = `https://www.maintenanceguide.life${route}`;
    if (snapshot.words < 200 || snapshot.links < 10 || snapshot.canonical !== canonical) throw new Error(`Incomplete snapshot: ${route}`);
    if (route !== '/service-areas' && !snapshot.root.includes('بنعرفك تكلفة الكشف قبل الزيارة')) throw new Error(`Fee line missing: ${route}`);
    let html = template;
    html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title data-rh="true">${esc(snapshot.title)}</title>`);
    for (const meta of snapshot.metas) {
      const tag = `<meta ${meta.key}="${esc(meta.name)}" content="${esc(meta.content || '')}" />`;
      const re = new RegExp(`<meta\\s+${meta.key}="${meta.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i');
      html = re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', tag + '</head>');
    }
    html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(snapshot.canonical)}" />`);
    // Include exactly the app's existing head schemas, including effect-created ones.
    html = html.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
    const originalSchemas = [...template.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => JSON.stringify(JSON.parse(m[1])));
    const schemas = snapshot.schemas.map((s) => {
      const temporary = originalSchemas.includes(JSON.stringify(s)) ? '' : ' data-mg-prerender-schema';
      return `<script type="application/ld+json"${temporary}>${JSON.stringify(s).replaceAll('<', '\\u003c')}</script>`;
    }).join('\n');
    html = html.replace('</head>', schemas + '\n</head>');
    html = html.replace(/<div id="root"><\/div>/, () => snapshot.root);
    // Existing page effects recreate their head schemas when JS runs.
    html = html.replace('</body>', `<script>document.querySelectorAll('script[data-mg-prerender-schema]').forEach(function(s){s.remove()})</script></body>`);
    if (!html.includes(snapshot.root)) throw new Error(`Root replacement failed: ${route}`);
    const output = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, html);
    console.log(`Prerendered ${route}: ${snapshot.words} words, ${snapshot.links} links`);
  }
} finally {
  if (browser) {
    const process = browser.process();
    await browser.disconnect();
    if (process && process.exitCode === null) process.kill('SIGKILL');
  }
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
      }
