/* A-14 · মৃত্যু দাবি নিষ্পত্তি — নমিনি, প্রমাণ চেকলিস্ট, কমিটি/প্রদান */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { claimMissing } from '../../../domain/admin';
import { Note, Page, StatBar } from './webParts';

export default function GsClaims() {
  const { state, settleClaim } = useAdmin();
  const nav = useNavigate();
  const { id } = useParams();
  const [sel, setSel] = useState(id ?? state.claims[0]?.id ?? '');
  const claim = state.claims.find((c) => c.id === sel) ?? state.claims[0];
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

  const act = (ok: boolean) => {
    if (!claim) return;
    const r = settleClaim(claim.id, ok);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };
  const missing = claim ? claimMissing(claim) : [];

  return (
    <Page title="নমিনি ও মৃত্যু দাবি" sub="প্রমাণ ছাড়া দাবি অনুমোদন হয় না · কমিটি সিদ্ধান্ত বাধ্যতামূলক · ডেমো"
      right={<Button size="sm" variant="secondary" onClick={() => nav('/w/members')}>সদস্য তালিকা</Button>}>
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'মোট দাবি', v: bn(state.claims.length) },
        { k: 'যাচাই চলছে', v: bn(state.claims.filter((c) => c.status === 'verify').length), tone: 'warn' },
        { k: 'কমিটিতে', v: bn(state.claims.filter((c) => c.status === 'committee').length) },
        { k: 'প্রদত্ত', v: bn(state.claims.filter((c) => c.status === 'paid').length), tone: 'ok' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          <Card title="দাবির তালিকা" sub="সদস্য বাছাই করলে বিস্তারিত দেখাবে">
            <div className="space-y-2">
              {state.claims.map((c) => (
                <button key={c.id} type="button" onClick={() => { setSel(c.id); nav(`/w/claims/${c.id}`, { replace: true }); }}
                  className={`min-h-10 w-full rounded-r-sm border px-3 py-2 text-left ${c.id === sel ? 'border-green-700 bg-green-050' : 'border-line-3 bg-card hover:bg-green-050'}`}>
                  <span className="flex items-center justify-between gap-2 text-sm">
                    <b>{c.member}</b>
                    <span className="num font-bold">৳{bn(c.amount)}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-mut mt-0.5">
                    <span>মৃত্যু {c.deathAt}</span><span>·</span><span>নমিনি {c.nominee} ({c.relation})</span>
                    <Badge tone={c.status === 'paid' ? 'ok' : c.status === 'committee' ? 'warn' : 'info'}>
                      {c.status === 'paid' ? 'প্রদত্ত' : c.status === 'committee' ? 'কমিটি' : 'যাচাই'}
                    </Badge>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {claim && (
            <Card title={`${claim.member} · ${claim.accNo}`} sub={`মৃত্যু ${claim.deathAt} · নমিনি ${claim.nominee} · ডেমো`}
              right={claim.disputed ? <Badge tone="danger">বিতর্কিত</Badge> : <Badge tone="ok">বিতর্ক নেই</Badge>}>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <p>হিসাবের ব্যালেন্স: <b className="num">৳{bn(claim.amount)}</b></p>
                <p>নমিনির অংশ: <b className="num">{bn(claim.sharePct)}%</b></p>
                <p>সম্পর্ক: <b>{claim.relation}</b></p>
                <p>কমিটি নম্বর: <b className="num">{claim.committeeNo || '—'}</b></p>
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {claim.docs.map((d) => (
                  <div key={d.t} className={`rounded-r-sm border px-3 py-2 text-sm ${d.ok ? 'border-ok-bd bg-ok-bg' : 'border-warn-bd bg-warn-bg'}`}>
                    <b>{d.ok ? '✓' : '!'} {d.t}</b>
                    <span className="block text-xs text-mut mt-0.5">{d.ok ? 'সংযুক্ত ও যাচাই' : 'সংযুক্ত নয় — সংগ্রহ করুন'}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card title="সিদ্ধান্ত" sub="সব প্রমাণ ছাড়া অনুমোদন বন্ধ">
            {claim ? (
              <>
                <div className="text-sm space-y-1 mb-3">
                  <p>অপেক্ষমাণ নথি: <b className="num">{bn(missing.length)}</b></p>
                  <p>অবস্থা: <Badge tone={claim.status === 'paid' ? 'ok' : 'warn'}>{claim.status === 'paid' ? 'প্রদত্ত' : claim.status === 'committee' ? 'কমিটি' : 'যাচাই'}</Badge></p>
                </div>
                <div className="grid gap-2">
                  <Button onClick={() => act(true)} disabled={missing.length > 0 || claim.status === 'paid'}>অনুমোদন ও প্রদান প্রস্তুত</Button>
                  <Button variant="secondary" onClick={() => act(false)} disabled={claim.status === 'paid'}>কমিটিতে পাঠান</Button>
                  <Button variant="secondary" onClick={() => nav(`/w/members/${claim.memberId}`)}>সদস্য ৩৬০° দেখুন</Button>
                </div>
                {missing.length > 0 && <p className="text-xs text-danger-ink mt-2">নথি বাকি: {missing.map((d) => d.t).join(' · ')}</p>}
              </>
            ) : <p className="text-sm text-mut">কোনো দাবি নেই।</p>}
          </Card>
          <Note>নমিনির অংশ ও ওয়ারিশ তালিকা মিলিয়ে প্রদান; বিতর্কিত হলে কমিটি সিদ্ধান্ত।</Note>
          <Note tone="warn">প্রদান = সঞ্চয়ের মূল টাকা; কোনো লভ্যাংশ বা সুদ নেই (D-01)।</Note>
          <Card title="প্রমাণ তালিকা">
            <ul className="text-sm text-mut space-y-1.5">
              <li>• মৃত্যু সনদ (মূল/সত্যায়িত)</li>
              <li>• নমিনির NID</li>
              <li>• ওয়ারিশ তালিকা</li>
              <li>• ব্যাংক/মোবাইল ওয়ালেট তথ্য</li>
            </ul>
          </Card>
        </div>
      </div>
    </Page>
  );
}
