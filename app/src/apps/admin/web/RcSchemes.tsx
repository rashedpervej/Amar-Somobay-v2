import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DataTable } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdminRo } from '../../../store/adminRoscaStore';
import { RC_METHOD, rcTotalPool } from '../../../domain/adminRosca';
import { Note, Page } from './webParts';

export default function RcSchemes() {
  const s = useAdminRo();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const archive = (id: string) => {
    if (confirmId !== id) { setConfirmId(id); return; }
    const r = s.archiveScheme(id);
    setMsg(r.message);
    setConfirmId(null);
  };

  return (
    <Page
      title="ROSCA স্কিম"
      sub="স্কিম সংস্করণ · সিট · কিস্তি · ড্র পদ্ধতি — পুরোনো চক্র অপরিবর্তিত থাকে (BR-21)"
      right={<Button size="sm" onClick={() => nav('/w/rc/schemes/new')}>নতুন স্কিম</Button>}
    >
      {msg && <Note tone="ok">{msg}</Note>}
      <Note tone="warn">সাব্যস্ত (fixed) চ্যানেল নিষ্ক্রিয় (D-12); ড্র পদ্ধতি ও সর্বোচ্চ চক্র/সদস্য পরিবর্তন কমিটির সিদ্ধান্তে (D-42 · D-48)।</Note>

      <Card title="স্কিম তালিকা" sub={`${bn(s.state.schemes.length)}টি · আর্কাইভড বাদে নতুন চক্র খোলা যায়`}>
        <DataTable
          caption="সিট × কিস্তি = প্রতি ড্র পুল; মোট পুল = প্রতি ড্র × সিট (D-38)"
          columns={[
            {
              key: 'name', head: 'স্কিম', render: (r) => (
                <button type="button" className="min-h-10 text-left" onClick={() => nav(`/w/rc/schemes/${r.id}`)}>
                  <b className="text-green-800 hover:underline block">{r.name}</b>
                  <span className="text-xs text-mut">{r.code}</span>
                </button>
              ),
            },
            { key: 'seats', head: 'সিট', align: 'center', render: (r) => bn(r.seats) },
            { key: 'contrib', head: 'কিস্তি', align: 'right', render: (r) => `৳${bn(r.contrib)}` },
            { key: 'freq', head: 'ফ্রিকোয়েন্সি' },
            { key: 'method', head: 'ড্র পদ্ধতি', render: (r) => RC_METHOD[r.drawMethod] },
            { key: 'pool', head: 'মোট পুল', align: 'right', render: (r) => `৳${bn(rcTotalPool(r))}` },
            { key: 'ver', head: 'সংস্করণ', align: 'center', render: (r) => `v${bn(r.version)}` },
            { key: 'st', head: 'অবস্থা', render: (r) => <Badge tone={r.status === 'active' ? 'ok' : 'neutral'}>{r.status === 'active' ? 'সক্রিয়' : 'আর্কাইভড'}</Badge> },
            {
              key: 'act', head: '', align: 'right', render: (r) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => nav(`/w/rc/schemes/${r.id}`)}>সম্পাদনা</Button>
                  {r.status === 'active' && (
                    <Button size="sm" variant={confirmId === r.id ? 'danger' : 'ghost'} onClick={() => archive(r.id)}>
                      {confirmId === r.id ? 'নিশ্চিত?' : 'আর্কাইভ'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={s.state.schemes}
        />
      </Card>
    </Page>
  );
}
