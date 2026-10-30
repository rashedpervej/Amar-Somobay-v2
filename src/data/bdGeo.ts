// Bangladesh geo data helper
import geoData from './bdGeo.json';

export const BD_DIVISIONS: string[] = geoData.divisions;
export const BD_DISTRICTS: Record<string, string[]> = geoData.districts;
export const BD_UPAZILAS: Record<string, string[]> = geoData.upazilas;
export const BD_DISTRICT_UPAZILA_UNIONS: Record<string, Record<string, string[]>> = geoData.districtUpazilaUnions;
export const BD_UNIONS: Record<string, string[]> = geoData.unions;

export function normalizeBengali(str?: string | null): string {
  if (!str) return '';
  return str
    .trim()
    .normalize('NFC')
    .replace(/\s*উপজেলা\s*$/, '')
    .trim();
}

export function normalizeUpazilaName(name?: string | null): string {
  if (!name) return '';
  return name.trim().normalize('NFC').replace(/\s*উপজেলা\s*$/, '').trim();
}

export function cleanUnionName(name?: string | null): string {
  if (!name) return '';
  const cleaned = name
    .trim()
    .normalize('NFC')
    .replace(/\s*(?:ইউনিয়ন|ইউনিয়ন|ইউপি|ইউ\.পি\.?)\s*$/, '')
    .trim();
  return cleaned || name.trim();
}

export function getUnionsByDistrictAndUpazila(district?: string | null, upazila?: string | null): string[] {
  if (!upazila) return [];
  const normDist = district ? normalizeBengali(district) : '';
  const cleanUpz = normalizeUpazilaName(upazila);
  const rawUpz = upazila.trim().normalize('NFC');

  // 1. Direct district match
  if (normDist) {
    const distKey = Object.keys(BD_DISTRICT_UPAZILA_UNIONS).find(
      k => normalizeBengali(k) === normDist
    );
    if (distKey) {
      const distMap = BD_DISTRICT_UPAZILA_UNIONS[distKey];
      if (distMap[cleanUpz]?.length) return distMap[cleanUpz];
      if (distMap[rawUpz]?.length) return distMap[rawUpz];
      if (distMap[`${cleanUpz} উপজেলা`]?.length) return distMap[`${cleanUpz} উপজেলা`];
      
      // Try normalized match inside district
      for (const [k, v] of Object.entries(distMap)) {
        if (normalizeBengali(k) === cleanUpz && v.length) return v;
      }
    }
  }

  // 2. Global upazila index
  if (BD_UNIONS[cleanUpz]?.length) return BD_UNIONS[cleanUpz];
  if (BD_UNIONS[rawUpz]?.length) return BD_UNIONS[rawUpz];
  if (BD_UNIONS[`${cleanUpz} উপজেলা`]?.length) return BD_UNIONS[`${cleanUpz} উপজেলা`];

  // Normalized search across global index
  for (const [k, v] of Object.entries(BD_UNIONS)) {
    if (normalizeBengali(k) === cleanUpz && v.length) return v;
  }

  return [];
}

export function getUnions(upazila: string): string[] {
  return getUnionsByDistrictAndUpazila(undefined, upazila);
}
