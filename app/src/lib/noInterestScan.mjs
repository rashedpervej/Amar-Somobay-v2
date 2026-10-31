/* ============================================================
   src/lib/noInterestScan.mjs — D-01 স্ট্যাটিক স্ক্যানার (শুধু Node/হার্নেস)
   browser bundle-এ node:fs ঢুকবে না বলে আলাদা ফাইল। নীতি-সংজ্ঞা noInterest.mjs থেকে আসে।
   ============================================================ */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { BANNED_FIELDS, scanText, termRegex } from './noInterest.mjs';

const FIELD_ALLOW_RE = /(নেই|নাই|হয়নি|রাখা হয়নি|থাকে না|নিষ্ক্রিয়|বাদ|নিষিদ্ধ|BANNED_FIELDS|ZERO_LOCKED_FIELDS|banned|removed|not exist|no such|does not|CHECK|CONSTRAINT|guard|নীতি|policy|D-01|D-02|allowed)/i;

const DEFAULT_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.sql', '.html', '.css', '.json'];
const DEFAULT_SKIP = ['node_modules', 'dist', '.git', 'bdGeo.json', 'package-lock.json'];

/** একটি ডিরেক্টরি ট্রি স্ক্যান করে D-01 লঙ্ঘন বের করে (ফাইল:লাইন সহ) */
export function scanSourceTree(root, { exts = DEFAULT_EXTS, skip = DEFAULT_SKIP, scanCopy = true, scanFields = true } = {}) {
  const findings = [];
  if (!existsSync(root)) return findings;

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (skip.includes(entry)) continue;
      const full = join(dir, entry);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) { walk(full); continue; }
      if (!exts.includes(extname(entry))) continue;
      const text = readFileSync(full, 'utf8');
      const lines = text.split('\n');
      const rel = relative(root, full);
      const isCss = extname(entry) === '.css' || extname(entry) === '.html';

      if (scanCopy) {
        lines.forEach((line, idx) => {
          for (const h of scanText(line)) {
            findings.push({ file: rel, line: idx + 1, kind: 'copy', term: h.term, severity: h.severity, text: line.trim().slice(0, 160), reason: h.reason });
          }
        });
      }

      if (scanFields) {
        lines.forEach((line, idx) => {
          if (FIELD_ALLOW_RE.test(line)) return;
          if (/profit_percentage\s*[:=]\s*0\b/.test(line)) return;
          const reported = new Set();
          for (const f of BANNED_FIELDS) {
            let at = -1;
            while ((at = line.indexOf(f, at + 1)) !== -1) {
              const before = line[at - 1] || '';
              const after = line[at + f.length] || '';
              if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) continue;
              if (before === '-') continue;
              if (before === '.' && (isCss || /class\s*=|className|<\w/.test(line))) continue;
              if (reported.has(at)) continue;
              reported.add(at);
              findings.push({ file: rel, line: idx + 1, kind: 'field', term: f, severity: 'error', text: line.trim().slice(0, 160), reason: `D-01: নিষিদ্ধ ফিল্ড ${f} কোডে ব্যবহৃত` });
              break;
            }
          }
        });
      }
    }
  };

  walk(root);
  return findings;
}

export default { scanSourceTree };
