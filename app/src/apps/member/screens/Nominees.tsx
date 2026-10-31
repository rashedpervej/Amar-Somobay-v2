/* ============================================================
   src/apps/member/screens/Nominees.tsx — M-19 নমিনি ব্যবস্থাপনা
   যোগ/সম্পাদনা/মুছে ফেলা — সবই স্টোরে সংরক্ষিত; শেয়ারের যোগফল ১০০%.
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { EmptyState, ErrorBanner, Field, SuccessBanner, inputClass } from '../../../components/form';
import { bn } from '../../../lib/bn';
import type { Nominee } from '../../../domain/member';
import { useMember } from '../../../store/memberStore';

const RELATIONS = ['স্ত্রী', 'স্বামী', 'পুত্র', 'কন্যা', 'পিতা', 'মাতা', 'ভাই', 'বোন'];

type Draft = Omit<Nominee, 'id'> & { id?: string };

const EMPTY: Draft = { name: '', relation: 'স্ত্রী', phone: '', nid: '', share: 100 };

export default function Nominees() {
  const { state, addNominee, updateNominee, removeNominee } = useMember();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState('');
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => state.nominees.reduce((s, n) => s + n.share, 0), [state.nominees]);

  function validate(d: Draft) {
    const e: Record<string, string> = {};
    if (d.name.trim().length < 3) e.name = 'নমিনির নাম লিখুন';
    if (!/^01\d{9}$/.test(d.phone.replace(/\D/g, ''))) e.phone = '১১ সংখ্যার মোবাইল নম্বর দিন';
    if (d.nid.replace(/\D/g, '').length < 10) e.nid = 'NID অন্তত ১০ সংখ্যা';
    if (!d.share || d.share < 1 || d.share > 100) e.share = 'শেয়ার ১–১০০%';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!draft || !validate(draft)) return;
    setBusy(true);
    try {
      if (draft.id) {
        const { id, ...patch } = draft;
        await updateNominee(id, patch);
        setFlash('নমিনির তথ্য হালনাগাদ হয়েছে');
      } else {
        const { id: _ignored, ...rest } = draft;
        await addNominee(rest);
        setFlash('নতুন নমিনি যোগ হয়েছে');
      }
      setDraft(null);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await removeNominee(id);
    setFlash('নমিনি সরানো হয়েছে');
  }

  return (
    <div className="p-4 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="min-h-tap flex items-center gap-1.5 text-sm font-bold text-green-700">
        <ArrowLeft size={16} /> ফিরে যান
      </button>

      {flash ? <SuccessBanner title="সম্পন্ন">{flash}</SuccessBanner> : null}

      <Card
        title="আমার নমিনি"
        sub="মোট শেয়ার ১০০% হওয়া উচিত"
        right={<Badge tone={total === 100 ? 'ok' : 'warn'}>শেয়ার {bn(total)}%</Badge>}
      >
        {state.nominees.length === 0 ? (
          <EmptyState title="কোনো নমিনি নেই" sub="যোগ করলে দুর্ঘটনায় পরিবার সুরক্ষিত থাকে" />
        ) : (
          <ul className="divide-y divide-line-2">
            {state.nominees.map((n) => (
              <li key={n.id} className="py-2.5 flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 grid place-items-center rounded-r-pill bg-green-050 text-green-700">
                  <Users size={16} />
                </span>
                <div className="grow min-w-0">
                  <div className="font-bold text-sm text-txt truncate">
                    {n.name} <span className="text-xs text-mut font-normal">· {n.relation}</span>
                  </div>
                  <div className="text-xs text-mut">
                    {n.phone} · শেয়ার {bn(n.share)}%
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" aria-label="সম্পাদনা" onClick={() => { setDraft(n); setErrors({}); }} className="w-9 h-9 grid place-items-center rounded-r-sm hover:bg-card-2">
                    <Pencil size={15} className="text-info" />
                  </button>
                  <button type="button" aria-label="সরান" onClick={() => remove(n.id)} className="w-9 h-9 grid place-items-center rounded-r-sm hover:bg-danger-bg">
                    <Trash2 size={15} className="text-danger" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button block className="mt-2" icon={<Plus size={16} />} onClick={() => { setDraft({ ...EMPTY, share: Math.max(1, 100 - total) }); setErrors({}); }}>
          নমিনি যোগ করুন
        </Button>
      </Card>

      {draft ? (
        <Card
          title={draft.id ? 'নমিনি সম্পাদনা' : 'নতুন নমিনি'}
          right={<Badge tone="brand">{draft.id ? 'সম্পাদনা' : 'নতুন'}</Badge>}
        >
          <div className="space-y-3">
            <Field label="নমিনির নাম" required error={errors.name}>
              {(id) => <input id={id} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass(errors.name)} />}
            </Field>

            <Field label="সম্পর্ক" required>
              {() => (
                <select value={draft.relation} onChange={(e) => setDraft({ ...draft, relation: e.target.value })} className={inputClass()}>
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="মোবাইল নম্বর" required error={errors.phone}>
              {(id) => <input id={id} value={draft.phone} inputMode="numeric" onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClass(errors.phone) + ' num'} placeholder="০১৭xxxxxxxx" />}
            </Field>

            <Field label="জাতীয় পরিচয়পত্র নম্বর" required error={errors.nid}>
              {(id) => <input id={id} value={draft.nid} inputMode="numeric" onChange={(e) => setDraft({ ...draft, nid: e.target.value })} className={inputClass(errors.nid) + ' num'} />}
            </Field>

            <Field label="শেয়ার (%)" required error={errors.share} hint="সব নমিনির মোট ১০০% হওয়া উচিত">
              {(id) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  value={draft.share}
                  onChange={(e) => setDraft({ ...draft, share: Number(e.target.value) })}
                  className={inputClass(errors.share) + ' num'}
                />
              )}
            </Field>

            {Object.keys(errors).length > 0 ? <ErrorBanner>তথ্য ঠিক করুন</ErrorBanner> : null}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => { setDraft(null); setErrors({}); }}>
                বাতিল
              </Button>
              <Button onClick={save} disabled={busy}>{busy ? 'সংরক্ষণ…' : 'সংরক্ষণ'}</Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card title="নমিনি নিয়ম" sub="শরিয়াহ-সম্মত বণ্টন">
        <ul className="list-disc pl-4 text-sm text-txt-2 space-y-1">
          <li>নমিনি মারা গেলে তাঁর উত্তরাধিকারের নিয়মে বণ্টন হবে — নমিনি শুধু প্রাপকের নাম নির্দেশ করে।</li>
          <li>একাধিক নমিনি রাখা যায়; শেয়ার যোগফল ১০০% রাখুন।</li>
          <li>তথ্য বদলালে নতুন করে সেভ করুন — পুরনো তথ্য লগে সংরক্ষিত থাকবে।</li>
        </ul>
      </Card>
    </div>
  );
}
