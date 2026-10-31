/* Shared loader for prototype pages (jsdom) */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire('/tmp/');
const { JSDOM } = require('jsdom');

export async function loadPage(file, { hash = '', runBoot = true, pre = null } = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const js = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const src = /src="([^"]+)"/.exec(m[1]);
    if (src) js.push(fs.readFileSync(path.join(dir, src[1]), 'utf8'));
    else if (m[2].trim()) js.push(m[2]);
  }
  const clean = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(clean, {
    runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'http://localhost/' + path.basename(file) + (hash ? '#' + hash : '')
  });
  const w = dom.window;
  const warns = [], errs = [];
  w.console = { log: () => {}, warn: (...a) => warns.push(a.join(' ')), error: (...a) => errs.push(a.join(' ')), info: () => {} };
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.IntersectionObserver = undefined;   /* fallback path: সব থাম্বনেইল সাথে সাথে রেন্ডার */
  const exp = `
;globalThis.__X = (function () {
  const g = (n) => { try { return eval(n); } catch (e) { return null; } };
  return { META: g('META'), MNAV: g('MNAV'), ANAV: g('ANAV'), ADMIN_SHELLS: g('ADMIN_SHELLS'),
           AMNAV_SCREEN: g('AMNAV_SCREEN'), WS: g('WS'), renderScreen: g('renderScreen'),
           STAFF: g('STAFF'), LIMIT_MATRIX: g('LIMIT_MATRIX'), SK_VALUES: g('SK_VALUES'), SKINS: g('SKINS'),
           MEMBERS: g('MEMBERS'), TODAY: g('TODAY'), tk: g('tk'), bn: g('bn'),
           JG_GOALS: g('JG_GOALS'), JG_PARTS: g('JG_PARTS'), JG_DISB: g('JG_DISB'), JG_CONTRIBS: g('JG_CONTRIBS'), JG_LIMIT: g('JG_LIMIT'),
           QH_PRODUCTS: g('QH_PRODUCTS'), QH_RULES: g('QH_RULES'), QH_RULE_VERSIONS: g('QH_RULE_VERSIONS'),
           QH_WINDOW: g('QH_WINDOW'), QH_ELIGIBLE: g('QH_ELIGIBLE'), QH_APPS: g('QH_APPS'), QH_LOANS: g('QH_LOANS'),
           QH_REPAYMENTS: g('QH_REPAYMENTS'), QH_WRITEOFFS: g('QH_WRITEOFFS'), QH_BLOCK: g('QH_BLOCK'),
           QH_WARN: g('QH_WARN'), QH_ME: g('QH_ME'), QH_IMPACT: g('QH_IMPACT'), QH_LIMIT: g('QH_LIMIT'),
           QH_APP_ST: g('QH_APP_ST'), QH_LOAN_ST: g('QH_LOAN_ST'), QH_CLASS: g('QH_CLASS') };
})();`;
  w.eval(js.join('\n;\n') + exp);
  if (pre) pre(w);
  if (runBoot) {
    /* DOMContentLoaded already fired during parsing in outside-only mode -> call boot manually */
    const boot = w.wsBoot || w.pvBoot;
    if (boot) boot();
    else w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  }
  return { dom, w, d: w.document, warns, errs };
}

export function report(name, checks) {
  let fail = 0;
  console.log('\n=== ' + name + ' ===');
  checks.forEach(([okc, msg]) => { if (!okc) { console.log('  ✗ ' + msg); fail++; } else console.log('  ✓ ' + msg); });
  console.log(fail === 0 ? '✅ ALL GREEN' : `❌ ${fail} FAILED`);
  return fail;
}
