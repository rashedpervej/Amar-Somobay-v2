/* A-36 · সেটিংস হাব — সংস্থা, সীমা, ফি, SMS, আর্কাইভ ও টগল */
import { useState } from 'react';
import { Badge, Button, Card } from '../../../components/ui';
import { bn } from '../../../lib/bn';
import { useAdmin } from '../../../store/adminStore';
import { settingsTotals } from '../../../domain/adminOps';
import { Note, Page, StatBar } from './webParts';

export default function GsSettings() {
  const { state, toggleSetting } = useAdmin();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const totals = settingsTotals(state.settings);
  const ready = state.setup.filter((s) => s.ok).length;

  const toggle = (key: string) => {
    const r = toggleSetting(key);
    if (!r.ok) { setErr(r.message); setMsg(''); } else { setErr(''); setMsg(r.message); }
  };

  return (
    <Page title="সেটিংস" sub="সংস্থা · সীমা · ফি · SMS · আর্কাইভ · ডেমো" back="/w/dashboard">
      {err && <Note tone="warn">{err}</Note>}
      {msg && <Note tone="ok">{msg}</Note>}
      <StatBar items={[
        { k: 'সেটিং', v: bn(totals.items) },
        { k: 'লকড নীতি', v: bn(totals.locked), tone: 'warn' },
        { k: 'প্রস্তুতি', v: `${bn(ready)}/${bn(state.setup.length)}`, tone: ready === state.setup.length ? 'ok' : 'warn' },
        { k: 'টগল চালু', v: bn(state.toggles.filter((x) => x.on).length), tone: 'ok' },
      ]} />

      <div className="grid gap-4 xl:grid-cols-2">
        {state.settings.map((g) => (
          <Card key={g.g} title={g.g} sub={`${bn(g.items.length)}টি সেটিং`}>
            <div className="space-y-2">
              {g.items.map((i) => (
                <div key={i.key} className="flex items-start justify-between gap-3 py-1.5 border-b border-line-2 last:border-0 text-sm">
                  <div className="min-w-0">
                    <b>{i.t}</b>
                    <div className="text-xs text-mut">{i.d}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <b className="num">{i.v}</b>
                    {i.locked ? <span className="block text-[11px] text-warn-ink">লকড</span> : <span className="block text-[11px] text-mut">সম্পাদনযোগ্য</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card title="চালু / বন্ধ" sub="প্রতিটি টগল অডিট লগে যাবে">
          <div className="space-y-2">
            {state.toggles.map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-3 py-1.5 border-b border-line-2 last:border-0">
                <div className="min-w-0"><b className="text-sm">{t.t}</b><div className="text-xs text-mut">{t.d}</div></div>
                <Button size="sm" variant={t.on ? 'secondary' : 'primary'} onClick={() => toggle(t.key)}>{t.on ? 'বন্ধ করুন' : 'চালু করুন'}</Button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="প্রস্তুতি চেকলিস্ট" sub="অসম্পূর্ণ থাকলে রিপোর্ট/রিটার্ন আটকাবে">
            {state.setup.map((s) => (
              <div key={s.t} className="flex items-center justify-between gap-2 py-1.5 border-b border-line-2 last:border-0 text-sm">
                <span>{s.t}</span>
                <Badge tone={s.ok ? 'ok' : 'warn'}>{s.ok ? 'প্রস্তুত' : 'বাকি'}</Badge>
              </div>
            ))}
          </Card>
          <Note tone="warn">maker ≠ checker, সুদমুক্ত নীতি ও আর্কাইভ মেয়াদ লকড — এই ডেমোতে বদলানো যায় না (BR-04 · D-01 · D-30)।</Note>
          <Note>ডেমো: সেটিংস শুধু এই সেশনে; বাস্তব কনফিগারেশন পরিবর্তন হয় না।</Note>
        </div>
      </div>
    </Page>
  );
}
