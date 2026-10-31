/* ============================================================
   src/apps/shared/screens/OfflineSync.tsx — S-08 অফলাইন Sync ও কিউ
   গ্রামীণ সংযোগে জমা হওয়া এন্ট্রি ফোনে থাকে; এখানে প্রতিটি retry/সব sync
   সত্যিই কিউ বদলায় এবং "শেষ sync" হালনাগাদ হয়।
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { EmptyState } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { SharedShell } from '../../../components/shell/SharedShell';
import { useSession } from '../../../store/sessionStore';

export default function OfflineSync() {
  const navigate = useNavigate();
  const { queue, retryItem, clearFailed, syncAll, lastSync, org } = useSession();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [allBusy, setAllBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const total = queue.reduce((s, i) => s + i.amount, 0);

  async function retry(id: string) {
    setBusyId(id);
    await retryItem(id);
    setBusyId(null);
    setFlash('এন্ট্রি পাঠানো হয়েছে');
  }

  async function all() {
    setAllBusy(true);
    await syncAll();
    setAllBusy(false);
    setFlash('সব এন্ট্রি sync হয়েছে');
  }

  return (
    <SharedShell
      title="অফলাইন Sync"
      sub={`${org.name} · শেষ sync ${lastSync}`}
      onBack={() => navigate('/account')}
      plain
      right={<Badge tone={queue.length ? 'warn' : 'ok'}>{queue.length ? `${bn(queue.length)} বাকি` : 'সম্পূর্ণ'}</Badge>}
    >
      {flash ? (
        <div className="rounded-r-sm bg-ok-bg border border-ok-bd text-ok-ink px-3 py-2 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {flash}
        </div>
      ) : null}

      <Card title="কিউ অবস্থা" sub={`${bn(queue.length)}টি এন্ট্রি · মোট ৳${bn(total)}`} right={<CloudOff size={17} className="text-mut" />}>
        <p className="text-sm text-txt-2">
          সংযোগ না থাকলে এন্ট্রি ফোনে সংরক্ষিত থাকে এবং সংযোগ পেলে সার্ভারে যায়। একই কিস্তি দুবার গণনা না হতে{' '}
          <code className="text-xs bg-card-2 px-1 rounded">idempotency_key</code> ব্যবহৃত হয়।
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button icon={<UploadCloud size={15} />} onClick={all} disabled={allBusy || queue.length === 0}>
            {allBusy ? 'পাঠানো হচ্ছে…' : 'সব sync করুন'}
          </Button>
          <Button variant="secondary" icon={<Trash2 size={15} />} onClick={() => { clearFailed(); setFlash('ব্যর্থ এন্ট্রি সরানো হয়েছে'); }} disabled={!queue.some((q) => q.status === 'failed')}>
            ব্যর্থ সরান
          </Button>
        </div>
      </Card>

      {queue.length === 0 ? (
        <Card>
          <EmptyState title="সব sync হয়েছে" sub="এই মুহূর্তে কোনো এন্ট্রি অপেক্ষায় নেই" action={<Button size="sm" onClick={() => navigate('/m/home')}>হোমে যান</Button>} />
        </Card>
      ) : (
        <div className="rounded-r-md border border-line bg-card overflow-hidden shadow-sh-1 divide-y divide-line-2">
          {queue.map((q) => (
            <div key={q.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill ${q.status === 'failed' ? 'bg-danger-bg text-danger-ink' : 'bg-warn-bg text-warn-ink'}`}>
                {q.status === 'failed' ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
              </span>
              <div className="grow min-w-0">
                <div className="text-sm font-bold text-txt truncate">{q.kind} · ৳{bn(q.amount)}</div>
                <div className="text-xs text-mut truncate">
                  {q.detail} · {q.at}
                </div>
              </div>
              <Button size="sm" variant={q.status === 'failed' ? 'secondary' : 'ghost'} onClick={() => retry(q.id)} disabled={busyId === q.id}>
                {busyId === q.id ? '…' : 'পাঠান'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Card title="কেন এন্ট্রি হারায় না" sub="অফলাইন-প্রথম নকশা">
        <ul className="list-disc pl-4 text-sm text-txt-2 space-y-1">
          <li>এন্ট্রি আগে ফোনে লেখা হয়, পরে সার্ভারে — তাই সংযোগ কেটে গেলেও কাজ শেষ।</li>
          <li>প্রতিটি এন্ট্রির অনন্য কী (idempotency_key) থাকায় ডুপ্লিকেট হয় না।</li>
          <li>sync ব্যর্থ হলে ১s → ৩s → ৯s বিরতিতে আবার চেষ্টা হয় (সর্বোচ্চ ৩ বার)।</li>
          <li>নগদ সংগ্রহকারীর রসিদ নম্বর ও অঙ্ক মিলিয়ে সার্ভার যাচাই করে।</li>
        </ul>
      </Card>

      <Button block variant="ghost" onClick={() => navigate('/error?type=offline')}>
        অফলাইন পেজ দেখুন
      </Button>
    </SharedShell>
  );
}
