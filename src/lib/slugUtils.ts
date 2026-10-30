// Utility for generating and resolving standardized unique cooperative slugs

// Basic phonetic transliteration for common Bengali words in cooperative names
const BN_TO_EN_MAP: Record<string, string> = {
  'গ্রামীণ': 'gramin',
  'সমবায়': 'somobay',
  'সমবায়': 'somobay',
  'সমিতি': 'samity',
  'সঞ্চয়': 'sanchay',
  'ঋণ': 'rin',
  'ক্ষুদ্র': 'khudra',
  'প্রগতি': 'progoti',
  'আশা': 'asha',
  'উন্নয়ন': 'unnayan',
  'জনকল্যাণ': 'jonokalyan',
  'একতা': 'ekota',
  'স্বপ্ন': 'swapna',
  'নবীন': 'nobin',
  'বিকাশ': 'bikash',
  'লিমিটেড': 'ltd'
};

/**
 * Generate a consistent, lowercase, kebab-case slug with a stable unique identifier.
 * Example: "গ্রামীণ সমবায় লিমিটেড" with id "00000000-0000-0000-0000-000000000001" -> "gramin-somobay-00000001"
 */
export function generateCooperativeSlug(name: string, id?: string): string {
  let cleanName = (name || '').trim();

  // Replace common Bengali cooperative terms with english phonetic tokens
  for (const [bn, en] of Object.entries(BN_TO_EN_MAP)) {
    cleanName = cleanName.split(bn).join(` ${en} `);
  }

  // Convert to lowercase ASCII kebab-case
  let baseSlug = cleanName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .trim()
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to -
    .replace(/^-+|-+$/g, ''); // strip leading/trailing -

  if (!baseSlug || baseSlug.length < 2) {
    baseSlug = 'somobay';
  }

  // Generate or extract a stable 8-character unique identifier
  let shortId = '00000001';
  if (id) {
    const rawId = id.replace(/-/g, '');
    shortId = rawId.length >= 8 ? rawId.slice(-8) : rawId.padStart(8, '0');
  } else {
    shortId = Math.random().toString(36).substring(2, 10);
  }

  return `${baseSlug}-${shortId}`;
}

/**
 * Resolve a URL slug or ID against a list of organizations.
 * Supports:
 * 1. Exact UUID match (e.g. 00000000-0000-0000-0000-000000000001)
 * 2. Exact slug match (e.g. gramin-somobay or gramin-somobay-00000001)
 * 3. Match by shortId suffix or slug prefix
 */
export function resolveOrganizationBySlug<T extends { id: string; slug?: string | null; name?: string }>(
  slugOrId: string,
  organizations: T[]
): T | null {
  if (!slugOrId || !organizations || organizations.length === 0) return null;

  const normalized = slugOrId.toLowerCase().trim();

  // 1. Direct ID match
  const directId = organizations.find(o => o.id.toLowerCase() === normalized);
  if (directId) return directId;

  // 2. Direct cooperative_code or reg_number match (e.g. SAM-4078)
  const codeMatch = organizations.find(o => {
    const code = ((o as any).cooperative_code || (o as any).reg_number || '').toLowerCase().trim();
    return code && code === normalized;
  });
  if (codeMatch) return codeMatch;

  // 3. Exact slug match
  const directSlug = organizations.find(o => o.slug && o.slug.toLowerCase() === normalized);
  if (directSlug) return directSlug;

  // 3. Match where existing slug is prefix or contains normalized slug
  const prefixSlug = organizations.find(o => {
    if (!o.slug) return false;
    const s = o.slug.toLowerCase();
    return s.startsWith(normalized) || normalized.startsWith(s);
  });
  if (prefixSlug) return prefixSlug;

  // 4. Match by short ID ending
  const cleanParam = normalized.replace(/-/g, '');
  const shortIdMatch = organizations.find(o => {
    const cleanOrgId = o.id.replace(/-/g, '').toLowerCase();
    return cleanOrgId.endsWith(cleanParam) || cleanParam.endsWith(cleanOrgId.slice(-8));
  });
  if (shortIdMatch) return shortIdMatch;

  // 5. Match by base name token or reg_number (e.g. 'yjhyn' from 'yjhyn-hww6rpi9')
  const baseToken = normalized.split('-')[0];
  const nameOrRegMatch = organizations.find(o => {
    const name = (o.name || '').toLowerCase().trim();
    const reg = ((o as any).reg_number || '').toLowerCase().trim();
    return (name && (name === normalized || name === baseToken || normalized.startsWith(name) || baseToken.startsWith(name))) ||
           (reg && (reg === normalized || normalized.includes(reg)));
  });
  if (nameOrRegMatch) return nameOrRegMatch;

  // 6. Fallback: If slugOrId is generic placeholder ('my', 'current', 'default')
  if (normalized === 'my' || normalized === 'current' || normalized === 'default') {
    return organizations[0] || null;
  }

  return null;
}
