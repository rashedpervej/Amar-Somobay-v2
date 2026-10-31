/* ============================================================
   src/apps/member/screens/Notices.tsx — M-17 সংস্থার নোটিশ বোর্ড
   পিন করা নোটিশ উপরে; প্রতিটি নোটিশ খুলে বিস্তারিত দেখা যায় (accordion)।
   ============================================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Megaphone, Pin } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { EmptyState } from '../../../components/form';
import { bn } from '../../../lib/bn';
import { useMember } from '../../../store/memberStore';

export default function Notices() {
  const { state } = useMember();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(
    () => [...state.notices].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)),
    [state.notices],
  );

  return (
    <div className="p-4 space-y-4">
      <Card title="নোটিশ বোর্ড" sub={`${state.profile.org} · ${bn(list.length)} নোটিশ`} right={<Badge tone="brand">M-17</Badge>}>
        <p className="text-sm text-txt-2">
          সংস্থার ঘোষণা, কিস্তির সময়সূচি ও সাধারণ সভার তথ্য এখানে প্রকাশিত হয়। গুরুত্বপূর্ণ নোটিশে পিন চিহ্ন থাকে।
        </p>
      </Card>

      {list.length === 0 ? (
        <Card>
          <EmptyState title="এখন কোনো নোটিশ নেই" sub="নতুন ঘোষণা এলে এখানে দেখা যাবে" />
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const open = openId === n.id;
            return (
              <div key={n.id} className="rounded-r-md border border-line bg-card shadow-sh-1 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : n.id)}
                  className="w-full min-h-tap px-4 py-3 flex items-start gap-3 text-left"
                  aria-expanded={open}
                >
                  <span className="w-9 h-9 shrink-0 grid place-items-center rounded-r-pill bg-green-050 text-green-700">
                    {n.pinned ? <Pin size={16} /> : <Megaphone size={16} />}
                  </span>
                  <span className="grow min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-sm text-txt">{n.title}</span>
                      {n.pinned ? <Badge tone="warn">পিন</Badge> : null}
                    </span>
                    <span className="block text-xs text-mut mt-0.5">{n.at}</span>
                    {!open ? <span className="block text-sm text-txt-2 mt-1 line-clamp-2">{n.body}</span> : null}
                  </span>
                  <ChevronDown size={16} className={`text-mut shrink-0 transition ${open ? 'rotate-180' : ''}`} />
                </button>
                {open ? (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-sm text-txt leading-relaxed whitespace-pre-line">{n.body}</p>
                    <Button size="sm" variant="secondary" className="mt-3" onClick={() => navigate('/m/help')}>
                      নোটিশ নিয়ে প্রশ্ন
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Card title="সাধারণ সভা" sub="সদস্যদের অংশগ্রহণ প্রত্যাশিত">
        <Button block variant="ghost" onClick={() => navigate('/m/settings')}>
          নোটিশ সেটিংস
        </Button>
      </Card>
    </div>
  );
}
