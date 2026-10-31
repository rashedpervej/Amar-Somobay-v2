/* src/lib/tenant.d.mts — D-02 tenant guard-এর টাইপ ঘোষণা (বাস্তবায়ন tenant.mjs-এ) */

export interface Membership {
  organization_id: string;
  user_id?: string;
  role?: string;
  status?: string;
}

export interface TenantContext {
  readonly userId: string;
  readonly platformAdmin: boolean;
  readonly memberships: readonly Membership[];
  readonly orgIds: readonly string[];
  readonly activeOrgId: string | null;
  roleOf(orgId: string | null | undefined): string | null;
}

export interface AccessResult {
  orgId: string;
  role: string;
  granted: boolean;
  reason?: string;
}

export interface RowCheckResult {
  ok: boolean;
  problems: Array<{ field: string; reason: string }>;
  orgId?: string;
}

export class TenantViolation extends Error {
  code: string;
  detail: Record<string, unknown>;
}

export function buildTenantContext(opts: {
  userId: string;
  memberships?: Membership[];
  platformAdmin?: boolean;
  activeOrganizationId?: string | null;
}): TenantContext;

export function assertOrgId(orgId: unknown, opts?: { allowDefaultOrg?: boolean; label?: string }): string;

export function assertOrgAccess(
  ctx: TenantContext,
  orgId: string,
  opts?: { minRole?: string; action?: string },
): AccessResult;

export function resolveRequestedOrg(
  ctx: TenantContext,
  requested: string,
  opts?: { knownOrgs?: Array<Record<string, unknown>> },
): { orgId: string; organization: Record<string, unknown> | null; role: string | null };

export function scopeQuery<T>(
  query: T,
  ctx: TenantContext,
  opts?: { orgId?: string | null; column?: string; required?: boolean },
): T;

export function orgAudience<T>(
  query: T,
  ctx: TenantContext,
  opts?: { orgId?: string | null; roles?: string[]; includeStatusActive?: boolean },
): T;

export function validateTenantRow(
  table: string,
  row: Record<string, unknown> | null,
  ctx: TenantContext,
  opts?: { orgId?: string | null },
): RowCheckResult;

export function scopedRows<T>(rows: T[], ctx: TenantContext, opts?: { orgId?: string | null; column?: string }): T[];

export const TENANT_ROLES: readonly string[];
export const RESERVED_ROLES: readonly string[];
export const ROLE_RANK: Readonly<Record<string, number>>;
export const ORG_SCOPED_TABLES: readonly string[];
export const CHILD_TABLE_PARENT: Readonly<Record<string, { table: string; via: string }>>;
export const FORBIDDEN_DEFAULT_ORG: string;

declare const _default: {
  TENANT_ROLES: readonly string[];
  RESERVED_ROLES: readonly string[];
  ROLE_RANK: Readonly<Record<string, number>>;
  ORG_SCOPED_TABLES: readonly string[];
  CHILD_TABLE_PARENT: Readonly<Record<string, { table: string; via: string }>>;
  FORBIDDEN_DEFAULT_ORG: string;
  TenantViolation: typeof TenantViolation;
  buildTenantContext: typeof buildTenantContext;
  assertOrgId: typeof assertOrgId;
  assertOrgAccess: typeof assertOrgAccess;
  resolveRequestedOrg: typeof resolveRequestedOrg;
  scopeQuery: typeof scopeQuery;
  orgAudience: typeof orgAudience;
  validateTenantRow: typeof validateTenantRow;
  scopedRows: typeof scopedRows;
};
export default _default;
