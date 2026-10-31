/* ============================================================
   app/tools/preview-server.mjs — `dist/`-এর লোকাল প্রিভিউ সার্ভার
   কেন দরকার: `python3 -m http.server` SPA ফলব্যাক জানে না, তাই /m/home-এ
   রিফ্রেশ করলে ৪০৪ আসে। Vercel-এ rewrites কাজটি করে; লোকালি এটাই করে।
   ব্যবহার:  node tools/preview-server.mjs [port]
   ============================================================ */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, rel);

  try {
    const info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) throw new Error('fallback');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    // SPA ফলব্যাক — যেকোনো অজানা পথে index.html
    try {
      const html = await readFile(join(DIST, 'index.html'));
      res.writeHead(200, { 'content-type': TYPES['.html'] });
      res.end(html);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('dist/ পাওয়া যায়নি — আগে `npm run build` চালান');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[preview] http://0.0.0.0:${PORT} → ${DIST} (SPA fallback চালু)`);
});
