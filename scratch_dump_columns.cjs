const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://jkxmcbzipmcmyiwfqupx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreG1jYnppcG1jbXlpd2ZxdXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTk4NTUsImV4cCI6MjA5Mzk3NTg1NX0.A_M283GTrji6A3P80zwaflmlpbjC6RJIuWLdtyZ_OOo';
const client = createClient(supabaseUrl, supabaseKey);

const tables = [
  'app_settings', 'audit_logs', 'joint_goal_expenses', 'member_actions',
  'member_plans', 'member_wallets', 'notifications', 'organization_members',
  'organizations', 'plan_payments', 'platform_admins', 'profiles',
  'promotions', 'qard_applications', 'qard_funds', 'qard_loans',
  'qard_repayments', 'rosca_periods', 'savings_withdrawals',
  'somobay_plans', 'wallet_transactions'
];

async function dumpColumns() {
  for (const t of tables) {
    // Attempt insert with dummy invalid object to get column list error or query an empty row
    const { data, error } = await client.from(t).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(`TABLE ${t}: [${Object.keys(data[0]).join(', ')}] (count: ${data.length})`);
    } else {
      // Query an insert with empty payload or check error
      const { error: insErr } = await client.from(t).insert({});
      console.log(`TABLE ${t} (empty):`, insErr ? insErr.message : 'inserted');
    }
  }
}

dumpColumns();
