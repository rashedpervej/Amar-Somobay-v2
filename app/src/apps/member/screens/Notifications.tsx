/* ============================================================
   src/apps/member/screens/Notifications.tsx — M-16 নোটিফিকেশন
   অপঠিত/পঠিত ফিল্টার, প্রতিটি নোটিফিকেশন পড়া হলে স্ট্যাটাস বদলায়,
   সংযুক্ত রুট থাকলে সেখানে যায়। সব একসাথে পঠিত করার সুযোগ আছে।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { Badge, Button, Card, Chip, Chipset } from '../../../components/ui';
import { EmptyState } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function Notifications() {
  const { state, markNotificationRead, markAllNotificationsRead, unreadCount } = useMember();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const list = useMemo(
    () => (filter === 'unread' ? state.notifications.filter((n) => !n.read) : state.notifications),
    [filter, state.notifications],
  );

  async function open(id: string, route?: string) {
    await markNotificationRead(id);
    if (route) navigate(route);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-h2 font-extrabold text-txt">নোটিফিকেশন</div>
          <div className="text-xs text-mut">{bn(unreadCount)} অপঠিত · মোট {bn(state.notifications.length)}</div>
        </div>
        {unreadCount > 0 ? (
          <Button size="sm" variant="secondary" icon={<CheckCheck size={15} />} onClick={() => markAllNotificationsRead()}>
            সব পঠিত
          </Button>
        ) : null}
      </div>

      <Chipset>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          সব
        </Chip>
        <Chip active={filter === 'unread'} onClick={() => setFilter('unread')}>
          অপঠিত
        </Chip>
      </Chipset>

      <div className="space-y-2">
        {list.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => open(n.id, n.route)}
            className={`w-full min-h-tap text-left rounded-r-md border p-3 flex gap-3 transition ${
              n.read ? 'bg-card border-line shadow-sh-1' : 'bg-green-050 border-line-2'
            }`}
          >
            <span className={`w-9 h-9 shrink-0 grid place-items-center rounded-r-pill ${n.read ? 'bg-card-2 text-mut' : 'bg-green-700 text-white'}`}>
              <Bell size={16} />
            </span>
            <span className="grow min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-bold text-sm text-txt truncate">{n.title}</span>
                {!n.read ? <span className="w-2 h-2 rounded-r-pill bg-green-700 shrink-0" /> : null}
              </span>
              <span className="block text-sm text-txt-2 mt-0.5">{n.body}</span>
              <span className="block text-xs text-mut mt-1">
                {n.at}
                {n.route ? ' · খুলুন ›' : ''}
              </span>
            </span>
          </button>
        ))}
        {list.length === 0 ? (
          <Card>
            <EmptyState
              title="কোনো নোটিফিকেশন নেই"
              sub="জমা, অনুমোদন বা ঘোষণা এলে এখানে জানানো হবে"
              action={<Button size="sm" onClick={() => setFilter('all')}>সব দেখুন</Button>}
            />
          </Card>
        ) : null}
      </div>

      <Card title="নোটিফিকেশন বন্ধ করবেন?" sub="SMS ও অ্যাপ-বার্তার সেটিং M-20-এ" right={<Badge tone="info"><BellOff size={12} /></Badge>}>
        <Button block variant="ghost" onClick={() => navigate('/m/settings')}>
          সেটিংসে যান
        </Button>
      </Card>
    </div>
  );
}
