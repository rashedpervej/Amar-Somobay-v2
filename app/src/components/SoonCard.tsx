/* ============================================================
   src/components/SoonCard.tsx — "এই পর্দা ফেজ ৩/৪-এ আসবে"
   ফাঁকা বাটন বা ভুয়া পর্দা না বানিয়ে সৎভাবে পরিকল্পনা দেখানো হয়।
   ============================================================ */

import { Badge, Card } from './ui';
import { bn } from '../lib/bn';

export function SoonCard({
  label,
  screenCode,
  phase = 'ফেজ ৩',
  note,
}: {
  label: string;
  screenCode?: string;
  phase?: string;
  note?: string;
}) {
  return (
    <div className="p-4">
      <Card
        title={label}
        sub={screenCode ? `পরিকল্পিত পর্দা ${screenCode}` : undefined}
        right={<Badge tone="info">{phase}</Badge>}
      >
        <p className="text-sm text-txt-2">
          এই পর্দাটি এখনো তৈরি হয়নি — স্ক্রিন ম্যাপিংয়ে আছে, বাস্তবায়ন {phase}-এ হবে।
        </p>
        {note ? <p className="text-xs text-mut mt-2">{note}</p> : null}
        <p className="text-xs text-mut mt-3">
          মোট পরিকল্পিত পর্দা {bn(207)} — এখন তৈরি {bn(7)}টি (শেল ডেমো + সদস্য ৫ + অ্যাডমিন ২)।
        </p>
      </Card>
    </div>
  );
}
