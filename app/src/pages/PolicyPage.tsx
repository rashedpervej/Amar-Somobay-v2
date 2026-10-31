import { useMemo, useState } from 'react';
import { Card, Button, Badge, Chip, Chipset, SectionHead, DataTable, PolicyBanner, KpiGrid, Kpi } from '../components/ui';
import { sanitizePlanPayload, qardRepaymentCheck, assertScheduleEqualsPrincipal } from '../lib/noInterest.mjs';
import { buildTenantContext, assertOrgAccess, validateTenantRow, FORBIDDEN_DEFAULT_ORG } from '../lib/tenant.mjs';
import { bn, money } from '../lib/money.mjs';

/* ============================================================
   নীতি স্তর — D-01 (সম্পূর্ণ সুদমুক্ত) ও D-02 (cross-tenant isolation)
   এই পৃষ্ঠাটি প্রমাণ করে যে নীতি দুটি শুধু কাগজে নয়, কোডে কার্যকর।
   ============================================================ */

const ORG_A = '11111111-1111-4111-8111-111111111111';
const ORG_B = '22222222-2222-4222-8222-222222222222';
const ORGS = [
  { id: ORG_A, name: 'আদর্শ সমবায় সমিতি লিমিটেড', code: 'ADRS-01' },
  { id: ORG_B, name: 'উত্তরণ সমবায় সমিতি লিমিটেড', code: 'UTTR-02' },
];
interface Membership { organization_id: string; role: string; status: string }
interface Actor { key: string; name: string; orgs: Membership[]; globalRole: string }

const ACTORS: Actor[] = [
  { key: 'a_admin', name: 'কামরুল হাসান', orgs: [{ organization_id: ORG_A, role: 'cooperative_admin', status: 'active' }], globalRole: 'member' },
  { key: 'a_collector', name: 'রাজু আহমেদ', orgs: [{ organization_id: ORG_A, role: 'collector', status: 'active' }], globalRole: 'member' },
  { key: 'a_member', name: 'আব্দুল করিম', orgs: [{ organization_id: ORG_A, role: 'member', status: 'active' }], globalRole: 'member' },
  { key: 'b_admin', name: 'নাসরিন আক্তার', orgs: [{ organization_id: ORG_B, role: 'cooperative_admin', status: 'active' }], globalRole: 'member' },
  { key: 'global_admin', name: 'বহিরাগত অ্যাডমিন', orgs: [], globalRole: 'admin' },
];

const ACTIONS = [
  { id: 'view', label: 'ড্যাশবোর্ড দেখা', minRole: 'member' },
  { id: 'collect', label: 'কিস্তি আদায়', minRole: 'collector' },
  { id: 'approve', label: 'ঋণ অনুমোদন', minRole: 'cooperative_admin' },
] as const;

export default function PolicyPage() {
  /* ---------- D-01 ---------- */
  const [profit, setProfit] = useState('10');
  const [rate, setRate] = useState('8');
  const [lateFee, setLateFee] = useState('50');
  const sanitized = useMemo(
    () => sanitizePlanPayload({
      name: 'মাসিক সঞ্চয় স্কিম',
      installment_amount: 1000,
      target_amount: 12000,
      late_fee_amount: Number(lateFee) || 0,
      profit_percentage: Number(profit) || 0, // নিষিদ্ধ ফিল্ড (D-01) — ডেমো ইনপুট, sanitizer দেখানোর জন্য
      interest_rate: Number(rate) || 0, // নিষিদ্ধ ফিল্ড (D-01) — ডেমো ইনপুট
    }) as any,
    [profit, rate, lateFee],
  );

  const [principal, setPrincipal] = useState('20000');
  const [repaid, setRepaid] = useState('5000');
  const [amount, setAmount] = useState('15000');
  const repay = useMemo(
    () => qardRepaymentCheck({ principal: Number(principal) || 0, totalRepaid: Number(repaid) || 0, amount: Number(amount) || 0 }) as any,
    [principal, repaid, amount],
  );
  const schedule = useMemo(
    () => assertScheduleEqualsPrincipal({
      principal: Number(principal) || 0,
      instalments: Array.from({ length: 4 }, () => ({ amount: Math.round((Number(principal) || 0) / 4) })),
    }) as any,
    [principal],
  );

  /* ---------- D-02 ---------- */
  const [actorKey, setActorKey] = useState<string>('a_admin');
  const [targetOrg, setTargetOrg] = useState<string>(ORG_A);
  const ctx = useMemo(() => {
    const a = ACTORS.find((x) => x.key === actorKey)!;
    return buildTenantContext({ userId: a.key, memberships: a.orgs, activeOrganizationId: ORG_A });
  }, [actorKey]);

  const matrix = useMemo(() => {
    const rows: any[] = [];
    for (const act of ACTIONS) {
      for (const org of ORGS) {
        let ok = false;
        let why = '';
        try {
          const r = assertOrgAccess(ctx, org.id, { minRole: act.minRole, action: act.id }) as any;
          ok = Boolean(r?.granted);
          why = ok ? `ভূমিকা: ${r.role}` : '';
        } catch (e: any) {
          ok = false;
          why = e?.code ? `${e.code}` : String(e?.message || e);
        }
        rows.push({ id: `${act.id}-${org.id}`, action: act.label, org: org.code, ok, why });
      }
    }
    return rows;
  }, [ctx]);

  const rowCheck = useMemo(() => {
    const own = validateTenantRow('qard_applications', { organization_id: ctx.activeOrgId, member_id: 'm1' }, ctx) as any;
    const foreign = validateTenantRow('qard_applications', { organization_id: targetOrg === ORG_A ? ORG_B : ORG_A, member_id: 'm1' }, ctx) as any;
    const nul = validateTenantRow('qard_applications', { organization_id: null, member_id: 'm1' }, ctx) as any;
    let def: any;
    try {
      def = validateTenantRow('savings_withdrawals', { organization_id: FORBIDDEN_DEFAULT_ORG, member_id: 'm1' }, ctx);
    } catch (e: any) {
      def = { ok: false, problems: [{ reason: e.code || e.message }] };
    }
    return { own, foreign, nul, def };
  }, [ctx, targetOrg]);

  return (
    <div className="space-y-4">
      <PolicyBanner tone="brand" title="D-01 · সম্পূর্ণ সুদমুক্ত">
        কোনো মডিউলে সুদ বা সুদ-সমতুল্য কিছু নেই। <span className="num">profit_percentage</span> সর্বদা ০-এ বাঁধা; নিষিদ্ধ ফিল্ড API স্তরেই সরে যায়।
        ব্যবহারকারীর সিদ্ধান্ত অনুযায়ী <b>বিলম্ব ফি/জরিমানা অপরিবর্তিত</b> — সেগুলো এই নীতির আওতার বাইরে।
      </PolicyBanner>

      <KpiGrid cols={4}>
        <Kpi label="সুদ ৳০" value="০" unit="টাকা" tone="brand" note="সব মডিউলে" />
        <Kpi label="profit_percentage" value="০" unit="(লকড)" tone="ok" note="DB CHECK + API sanitizer" />
        <Kpi label="নিষিদ্ধ ফিল্ড" value={bn(12)} unit="টি" tone="danger" note="BANNED_FIELDS" />
        <Kpi label="বিলম্ব ফি" value="অপরিবর্তিত" tone="neutral" note="আওতার বাইরে (আপনার সিদ্ধান্ত)" />
      </KpiGrid>

      <SectionHead title="D-01 · পরীক্ষা করুন" sub="স্কিম পে-লোডে মান দিন — দেখুন, সুদের কোনো মানই গ্রহণযোগ্য নয় (০-এ বাঁধা পড়ে)" />
      <Card>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-txt-2">profit_percentage (নিষিদ্ধ)</span>
            <input className="num mt-1 w-full min-h-tap px-3 rounded-r-sm border border-line-3 bg-card-2" value={profit} onChange={(e) => setProfit(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-txt-2">interest_rate (নিষিদ্ধ)</span>
            <input className="num mt-1 w-full min-h-tap px-3 rounded-r-sm border border-line-3 bg-card-2" value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-txt-2">late_fee_amount (বৈধ)</span>
            <input className="num mt-1 w-full min-h-tap px-3 rounded-r-sm border border-line-3 bg-card-2" value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-r-sm border border-line bg-card-2 p-3">
            <div className="text-xs font-bold text-mut mb-1">পরিষ্কার পে-লোড (DB-তে যাবে)</div>
            <pre className="num text-xs whitespace-pre-wrap break-all text-txt">{JSON.stringify(sanitized.payload, null, 2)}</pre>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge tone={sanitized.compliant ? 'ok' : 'danger'} dot>{sanitized.compliant ? 'নীতি মেনে চলছে' : 'নীতি লঙ্ঘন ধরা পড়েছে'}</Badge>
              <span className="text-sm text-mut num">{bn(sanitized.violations.length)}টি লঙ্ঘন · {bn(sanitized.removed.length)}টি ফিল্ড সরানো</span>
            </div>
            {sanitized.violations.map((v: any, i: number) => (
              <div key={i} className="rounded-r-sm border border-danger-bd bg-danger-bg px-3 py-2 text-sm text-danger-ink">
                <b className="num">{v.field}</b> — {v.reason}
              </div>
            ))}
            {sanitized.removed.map((r: any, i: number) => (
              <div key={i} className="rounded-r-sm border border-warn-bd bg-warn-bg px-3 py-2 text-sm text-warn-ink">
                ফিল্ড <b className="num">{r.field}</b> সরানো হয়েছে (মান ছিল <span className="num">{String(r.value)}</span>)
              </div>
            ))}
            <div className="rounded-r-sm border border-ok-bd bg-ok-bg px-3 py-2 text-sm text-ok-ink">
              বিলম্ব ফি অক্ষত: <b className="num">late_fee_amount = {String(sanitized.payload.late_fee_amount)}</b>
            </div>
          </div>
        </div>
      </Card>

      <SectionHead title="D-01 · কর্জে হাসানা পরিশোধ" sub="মূল ঋণের বাইরে এক টাকাও নয়" />
      <Card>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-txt-2">মূল ঋণ (৳)</span>
            <input className="num mt-1 w-full min-h-tap px-3 rounded-r-sm border border-line-3 bg-card-2" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-txt-2">ইতোমধ্যে পরিশোধিত (৳)</span>
            <input className="num mt-1 w-full min-h-tap px-3 rounded-r-sm border border-line-3 bg-card-2" value={repaid} onChange={(e) => setRepaid(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-txt-2">এবার পরিশোধ (৳)</span>
            <input className="num mt-1 w-full min-h-tap px-3 rounded-r-sm border border-line-3 bg-card-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={repay.ok ? 'ok' : 'danger'} dot>{repay.ok ? 'গ্রহণযোগ্য' : 'প্রত্যাখ্যাত'}</Badge>
          <span className="text-sm text-txt-2">পরিশোধের পর বাকি মূল: <b className="num">{money(repay.outstanding * 100)}</b></span>
          {repay.reason && <span className="text-sm text-danger-ink">{repay.reason}</span>}
        </div>
        <div className="mt-3 text-sm text-mut">
          ৪টি সমান কিস্তির সমষ্টি = <b className="num">{money(schedule.scheduleTotal * 100)}</b> · মূল ঋণ = <b className="num">{money(schedule.principal * 100)}</b>{' '}
          <Badge tone={schedule.ok ? 'ok' : 'danger'}>{schedule.ok ? 'হুবহু সমান (সুদ ৳০)' : 'পার্থক্য আছে'}</Badge>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setAmount(String(Math.max(0, Number(principal) - Number(repaid)))); }}>বাকি মূল বসাও</Button>
          <Button size="sm" variant="secondary" onClick={() => { setAmount(String(Number(principal) - Number(repaid) + 100)); }}>১০০ টাকা বেশি (পরীক্ষা)</Button>
        </div>
      </Card>

      <PolicyBanner tone="info" title="D-02 · Cross-Tenant Isolation">
        প্রতিটি সমবায়ের ডেটা আলাদা। ভূমিকা শুধু <span className="num">organization_members</span> থেকে আসে — বৈশ্বিক <span className="num">profiles.role</span> থেকে নয়।
        client-পাঠানো <span className="num">organization_id</span> একা বিশ্বাসযোগ্য নয়; ডিফল্ট org fallback নিষিদ্ধ।
      </PolicyBanner>

      <SectionHead title="D-02 · পরীক্ষা করুন" sub="ব্যবহারকারী ও লক্ষ্য সমবায় বেছে নিন" />
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-bold text-mut mb-1.5">ব্যবহারকারী</div>
            <Chipset>
              {ACTORS.map((a) => (
                <Chip key={a.key} active={actorKey === a.key} onClick={() => setActorKey(a.key)}>
                  {a.name}{a.globalRole === 'admin' ? ' (বৈশ্বিক admin)' : ''}
                </Chip>
              ))}
            </Chipset>
          </div>
          <div>
            <div className="text-xs font-bold text-mut mb-1.5">লক্ষ্য সমবায় (সারি-যাচাই পরীক্ষার জন্য)</div>
            <Chipset>
              {ORGS.map((o) => (
                <Chip key={o.id} active={targetOrg === o.id} onClick={() => setTargetOrg(o.id)}>{o.name}</Chip>
              ))}
            </Chipset>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            caption="অ্যাক্সেস ম্যাট্রিক্স — গার্ড স্তরের সিদ্ধান্ত"
            columns={[
              { key: 'action', head: 'ক্রিয়া' },
              { key: 'org', head: 'সমবায়' },
              { key: 'ok', head: 'সিদ্ধান্ত', render: (r: any) => <Badge tone={r.ok ? 'ok' : 'danger'} dot>{r.ok ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}</Badge> },
              { key: 'why', head: 'কারণ', render: (r: any) => <span className="num text-xs text-mut">{r.why}</span> },
            ]}
            rows={matrix}
          />
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-r-sm border border-ok-bd bg-ok-bg p-3 text-sm text-ok-ink">
            <b>নিজের সমবায়ে সারি লেখা</b><br />
            {rowCheck.own.ok ? '✅ গ্রহণযোগ্য' : '❌ ' + rowCheck.own.problems?.[0]?.reason}
          </div>
          <div className="rounded-r-sm border border-danger-bd bg-danger-bg p-3 text-sm text-danger-ink">
            <b>অন্য সমবায়ের হয়ে সারি লেখা</b><br />
            {rowCheck.foreign.ok ? '❌ অনুমতি দেওয়া হয়েছে (ত্রুটি!)' : '✅ প্রত্যাখ্যাত — ' + rowCheck.foreign.problems?.[0]?.reason}
          </div>
          <div className="rounded-r-sm border border-danger-bd bg-danger-bg p-3 text-sm text-danger-ink">
            <b>organization_id = null</b><br />
            {rowCheck.nul.ok ? '❌ অনুমতি দেওয়া হয়েছে (ত্রুটি!)' : '✅ প্রত্যাখ্যাত — ' + rowCheck.nul.problems?.[0]?.reason}
          </div>
          <div className="rounded-r-sm border border-danger-bd bg-danger-bg p-3 text-sm text-danger-ink">
            <b>হার্ডকোডেড ডিফল্ট org</b><br />
            {rowCheck.def.ok ? '❌ অনুমতি দেওয়া হয়েছে (ত্রুটি!)' : '✅ প্রত্যাখ্যাত — ' + rowCheck.def.problems?.[0]?.reason}
          </div>
        </div>

        <div className="mt-3 text-xs text-mut">
          সক্রিয় সমবায়: <span className="num">{ctx.activeOrgId ?? '(নির্ধারিত নয়)'}</span> · ভূমিকা: <span className="num">{String(ctx.roleOf(ctx.activeOrgId) ?? '—')}</span> ·
          সদস্যপদ: <span className="num">{bn(ctx.orgIds.length)}টি সমবায়</span>
        </div>
      </Card>

      <Card tone="warn" title="Phase 1-এ যা করা হয়নি" footer="পরের ধাপে অনুমোদন নিয়ে করা হবে">
        <ul className="text-sm text-txt-2 space-y-1 list-disc pl-5">
          <li>কোনো production database পরিবর্তন করা হয়নি — SQL শুধু ড্রাফট (<span className="num">app/db/</span>)।</li>
          <li>Source A-র কোড সরাসরি বদলানো হয়নি — পরিবর্তন <span className="num">patches/</span>-এ diff হিসেবে আছে।</li>
          <li>লাইভ Supabase টেস্ট এখনো চলেনি (offline harness সম্পন্ন; staging credentials লাগবে)।</li>
          <li>লেজার, maker≠checker, রশিদ/QR, যোগ্যতা ইঞ্জিন — Phase 2+ (specs/06 E.10)।</li>
        </ul>
      </Card>
    </div>
  );
}
