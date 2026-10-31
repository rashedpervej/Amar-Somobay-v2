/* tests/_harness.mjs — ছোট অ্যাসারশন/রিপোর্ট ফ্রেমওয়ার্ক (npm নির্ভরতা নেই) */

const BN = (v) => String(v ?? '').replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export function createSuite(title) {
  let pass = 0;
  const failures = [];
  const skips = [];
  let section = '';

  const out = [];
  const log = (s = '') => out.push(s);

  log(`\n════ ${title} ════`);

  function sec(name) {
    section = name;
    log(`\n── ${name}`);
  }

  function check(label, cond, info) {
    if (cond) { pass += 1; log(`  ✅ ${label}`); }
    else {
      failures.push({ section, label, info });
      log(`  ❌ ${label}` + (info ? `  → ${typeof info === 'string' ? info : JSON.stringify(info)}` : ''));
    }
    return Boolean(cond);
  }

  function eq(label, actual, expected) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    return check(label, a === b, a === b ? undefined : `প্রত্যাশিত ${b}, পেলাম ${a}`);
  }

  function throwsWith(label, fn, codeOrRe) {
    try {
      const r = fn();
      if (r && typeof r.then === 'function') {
        return check(label, false, 'async fn — use throwsAsync');
      }
      return check(label, false, 'কোনো ত্রুটি ছাড়াই সম্পন্ন হয়েছে (প্রত্যাখ্যান হওয়ার কথা)');
    } catch (e) {
      const ok = codeOrRe instanceof RegExp ? codeOrRe.test(e.code || e.message) : (e.code === codeOrRe || String(e.message).includes(codeOrRe));
      return check(label, ok, ok ? undefined : `ভুল ত্রুটি: ${e.code || e.message}`);
    }
  }

  async function throwsAsync(label, fn, codeOrRe) {
    try {
      await fn();
      return check(label, false, 'প্রত্যাখ্যাত হওয়ার কথা ছিল, কিন্তু সফল হয়েছে');
    } catch (e) {
      const ok = codeOrRe instanceof RegExp ? codeOrRe.test(e.code || e.message) : (e.code === codeOrRe || String(e.message).includes(String(codeOrRe)));
      return check(label, ok, ok ? undefined : `ভুল ত্রুটি: ${e.code || e.message}`);
    }
  }

  async function deniedAsync(label, promise, note = '') {
    const { error, data, count } = await promise;
    const ok = Boolean(error) || count === 0;
    return check(label, ok, ok ? undefined : `অনুমতি দেওয়া হয়েছে ${note}(data=${JSON.stringify(data)?.slice(0, 80)})`);
  }

  async function allowedAsync(label, promise, note = '') {
    const { error } = await promise;
    return check(label, !error, error ? `${note} → ${error.message}` : undefined);
  }

  /* ⏭ SKIP — বাহ্যিক/ঐচ্ছিক নির্ভরতা না থাকলে ফেল নয়, কারণসহ বাদ দেওয়া হয়।
     (ব্যবহারকারীর সিদ্ধান্ত, ৩১ অক্টোবর ২০২৬: reference/ ডুপ্লিকেট কপি বানানো হবে না) */
  function skip(label, reason) {
    skips.push({ section, label, reason });
    log(`  ⏭ ${label} — SKIP${reason ? ` (${reason})` : ''}`);
    return false;
  }

  function note(text) { log(`  ⓘ ${text}`); }

  function report({ exitOnFail = true } = {}) {
    const fail = failures.length;
    log('');
    log(`  মোট: ${BN(pass + fail)} · পাস ${BN(pass)} · ফেল ${BN(fail)}`
        + (skips.length ? ` · স্কিপ ${BN(skips.length)}` : ''));
    if (skips.length) {
      log('\n  স্কিপ করা চেক (কারণসহ):');
      for (const s of skips) log(`   • [${s.section}] ${s.label} — ${s.reason}`);
    }
    if (fail) {
      log('\n  ব্যর্থ চেক:');
      for (const f of failures) log(`   • [${f.section}] ${f.label}${f.info ? ` — ${typeof f.info === 'string' ? f.info : JSON.stringify(f.info)}` : ''}`);
    }
    const text = out.join('\n');
    console.log(text);
    if (exitOnFail && fail) process.exitCode = 1;
    return { pass, fail, failures, skips, text };
  }

  return { sec, check, eq, throwsWith, throwsAsync, deniedAsync, allowedAsync, note, skip, report, get failures() { return failures; }, get skips() { return skips; } };
}

export { BN };
