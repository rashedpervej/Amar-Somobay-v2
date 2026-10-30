import { supabase } from './supabase';
import { CooperativeSetupPayload } from '../types/cooperativeSetup';
import { generateCooperativeSlug } from './slugUtils';

export const cooperativeService = {
  // Create or update cooperative via wizard
  async saveCooperative(payload: CooperativeSetupPayload, orgId?: string, userId?: string) {
    try {
      const cooperativeCode = payload.reg_number || `SAM-${Math.floor(1000 + Math.random() * 9000)}`;

      const orgData: any = {
        name: payload.name,
        cooperative_code: cooperativeCode,
        slug: cooperativeCode.toLowerCase(),
        reg_number: cooperativeCode,
        status: payload.is_draft ? 'pending' : 'active'
      };

      let targetOrgId = orgId;

      if (!targetOrgId) {
        // Insert new organization
        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert(orgData)
          .select()
          .single();

        if (orgErr) throw orgErr;
        targetOrgId = newOrg.id;

        // If a creator userId is provided, assign as cooperative_admin
        if (userId) {
          await supabase.from('organization_members').insert({
            organization_id: targetOrgId,
            user_id: userId,
            role: 'cooperative_admin',
            status: 'active'
          });
        }
      } else {
        // Update existing
        const { error: updErr } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', targetOrgId);

        if (updErr) throw updErr;
      }

      // Sync settings into app_settings (or organization settings)
      const settingsPayload: any = {
        organization_id: targetOrgId,
        organization_name: payload.name,
        app_name: payload.name,
        footer_text: `পরিচালনায়: ${payload.name}`,
        logo_url: payload.logo_url || null
      };

      const { data: existingSettings } = await supabase
        .from('app_settings')
        .select('id')
        .eq('organization_id', targetOrgId)
        .limit(1);

      if (existingSettings && existingSettings.length > 0) {
        await supabase
          .from('app_settings')
          .update(settingsPayload)
          .eq('id', existingSettings[0].id);
      } else {
        await supabase
          .from('app_settings')
          .insert(settingsPayload);
      }

      // Persist modular config in localStorage as fast local cache and sync to server
      if (typeof window !== 'undefined') {
        localStorage.setItem(`org_config_${targetOrgId}`, JSON.stringify(payload));
      }

      return { success: true, organizationId: targetOrgId, slug: orgData.slug };
    } catch (err: any) {
      console.error('Error saving cooperative:', err);
      return { success: false, error: err.message || 'সমবায় তৈরি বা সংরক্ষণ করতে ব্যর্থ হয়েছে।' };
    }
  },

  // Get active organization configuration
  async getCooperativeConfig(orgId: string): Promise<Partial<CooperativeSetupPayload> | null> {
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`org_config_${orgId}`);
        if (local) return JSON.parse(local);
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (!org) return null;

      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      return {
        name: org.name,
        legal_status: org.reg_number ? 'registered' : 'unregistered',
        reg_number: org.reg_number,
        logo_url: appSettings?.logo_url,
        enabled_modules: ['general_cooperative', 'savings', 'qard_hasanah', 'rosca', 'joint_goal', 'reports', 'notifications']
      };
    } catch (e) {
      console.error('Error getting cooperative config:', e);
      return null;
    }
  }
};
