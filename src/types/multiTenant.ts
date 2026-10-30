export type CooperativeType = 'General' | 'savings' | 'rosca' | 'joint_goal';

export type UserOrgRole = 'cooperative_admin' | 'collector' | 'member';
export type OrgMemberStatus = 'active' | 'pending' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  cooperative_code?: string;
  reg_number?: string | null;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserOrgRole;
  status: OrgMemberStatus;
  joined_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  permission_level: 'platform_owner' | 'auditor';
  granted_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}
