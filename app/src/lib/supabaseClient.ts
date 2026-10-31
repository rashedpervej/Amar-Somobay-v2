import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* ============================================================
   Supabase client — Phase 1
   নিরাপত্তা নিয়ম:
     • শুধু URL + anon (publishable) key। service_role key কখনোই client-এ আসবে না।
     • env অনুপস্থিত হলে placeholder দিয়ে চালিয়ে যাওয়া হয় না (Source A-র আচরণ) —
       বরং স্পষ্ট ত্রুটি। নইলে ভুল tenant-এ নীরবে লেখা হতে পারে (D-02 ঝুঁকি)।
     • এই ফাইলে কোনো credential হার্ডকোড নেই।
   ============================================================ */

const SERVICE_KEY_MARKERS = ['service_role', 'SERVICE_ROLE'];

function readEnv(name: string): string | undefined {
  const env = (import.meta as any).env ?? {};
  const nodeEnv = (globalThis as any).process?.env;
  return env[name] || (nodeEnv ? (nodeEnv[name] as string | undefined) : undefined);
}

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = readEnv('VITE_SUPABASE_URL');
  const anon = readEnv('VITE_SUPABASE_ANON_KEY');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (serviceKey || SERVICE_KEY_MARKERS.some((m) => String(anon ?? '').includes(m))) {
    throw new Error('নিরাপত্তা ত্রুটি: service_role key কখনোই client bundle-এ দেওয়া যাবে না। শুধু anon key ব্যবহার করুন।');
  }
  if (!url || !anon) {
    throw new Error('Supabase কনফিগারেশন অনুপস্থিত: VITE_SUPABASE_URL ও VITE_SUPABASE_ANON_KEY সেট করুন (.env.local)।');
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url)) {
    throw new Error('Supabase URL বৈধ নয় (প্রত্যাশিত: https://<project>.supabase.co)।');
  }

  cached = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    realtime: { params: { eventsPerSecond: 2 } },
  });
  return cached;
}

/** টেস্ট/হার্নেসের জন্য — কোনো network নয় */
export function isConfigured(): boolean {
  return Boolean(readEnv('VITE_SUPABASE_URL') && readEnv('VITE_SUPABASE_ANON_KEY'));
}
