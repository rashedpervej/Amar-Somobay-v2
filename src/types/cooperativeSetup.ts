export interface CooperativeSetupPayload {
  // Cooperative Type
  cooperative_type?: 'general_cooperative' | 'rosca' | 'joint_goal';

  // Step 1 — Cooperative Information
  name: string;
  logo_url?: string | null;
  activity_type: string;
  description?: string;
  country: string;
  division: string;
  district: string;
  upazila: string;
  local_area: string;
  contact_number: string;
  address: string;

  // Step 2 — Registration and Legal Information
  legal_status: 'unregistered' | 'in_progress' | 'registered';
  reg_number?: string | null;
  reg_date?: string | null;
  certificate_url?: string | null;
  bylaws_url?: string | null;

  // Step 3 — Membership and Management
  membership_rules?: string;
  committee: {
    chairperson?: string;
    secretary?: string;
    treasurer?: string;
    manager?: string;
  };

  // Step 4 — Financial Rules and Accounting
  currency: string;
  financial_year_start: string;
  financial_year_end: string;
  separate_share_capital: boolean;
  savings_method: 'fixed' | 'flexible' | 'both';
  withdrawal_approval_required: boolean;

  // Step 5 — Select Modules
  enabled_modules: string[];

  // Step 6 — Meta
  is_draft?: boolean;
}

export interface GeneralSavingsConfig {
  plan_name: string;
  savings_type: 'fixed' | 'flexible' | 'both';
  frequency: 'weekly' | 'monthly' | 'custom';
  installment_amount: number;
  start_date: string;
  end_date?: string | null;
  min_deposit_amount: number;
  allow_partial_deposit: boolean;
  require_withdrawal_approval: boolean;
  allow_withdrawals: boolean;
  due_day?: number;
  due_date?: number;
}
