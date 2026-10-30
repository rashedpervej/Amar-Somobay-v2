import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Enable JSON body parsing
app.use(express.json());

// Enable CORS for cross-origin requests (e.g. Superadmin port 4001)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Data directory for cross-device shared storage (Desktop + Mobile sync)
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const promotionsFilePath = path.join(dataDir, 'promotions.json');
const fontSettingsFilePath = path.join(dataDir, 'font_settings.json');

function readFontSettings() {
  try {
    if (fs.existsSync(fontSettingsFilePath)) {
      const content = fs.readFileSync(fontSettingsFilePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading font_settings.json:', err);
  }
  return { bangla_font: 'system_default' };
}

function writeFontSettings(settings: any) {
  try {
    fs.writeFileSync(fontSettingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing font_settings.json:', err);
    return false;
  }
}

const INITIAL_PROMOTIONS = [
  {
    id: 'promo-1',
    title: 'ছোট সঞ্চয়, বড় স্বপ্ন ✨',
    subtitle: 'নিয়মিত সঞ্চয় করুন,\nভবিষ্যৎ হবে সুরক্ষিত।',
    category: 'লক্ষ্য',
    right_widget_type: 'progress',
    target_text: 'লক্ষ্য: ৳১২,০০০',
    progress_percent: 80,
    image_url: 'https://cdn3d.iconscout.com/3d/premium/thumb/finance-target-3d-icon-png-download-13750580.png',
    details_image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80',
    details_content: `### নিয়মিত সঞ্চয়ের গুরুত্ব ও ভবিষ্যৎ পরিকল্পনা

একটি সফল সমবায় সমিতির মূল ভিত্তি হলো শৃঙ্খলা ও সময়ানুবর্তিতা। আপনি যখন প্রতি সপ্তাহে বা মাসে নির্দিষ্ট কিস্তির টাকা জমা করেন, তখন শুধু আপনার সঞ্চয়ই বাড়ে না—বরং সমবায়ের তহবিল শক্তিশালী হয়।

#### আমাদের সঞ্চয় স্কিমের সুবিধাসমূহ:
- **১০০% সুরক্ষিত তহবিল:** আপনার প্রতিটি কিস্তির ডিজিটাল ট্র্যাকিং ও তাৎক্ষণিক রসিদ।
- **জরুরি প্রয়োজনে সহায়তা:** মেয়াদের মাঝেও বিশেষ প্রয়োজনে ঋণ বা যৌথ সহায়তা পাওয়ার সুযোগ।
- **মেয়াদান্তে নিশ্চিত প্রবৃদ্ধি:** সঞ্চয়ের লক্ষ্য পূরণ হলে এককালীন মূলধন ও প্রফিট বিতরণ।

> *পরামর্শ: কিস্তির নির্ধারিত তারিখের আগেই টাকা জমা দিয়ে বিলম্ব ফি ও জরিমানা এড়িয়ে চলুন।*`,
    cta_text: 'আমার সমিতি দেখুন',
    cta_link: '/somobay/my',
    cta_type: 'somobay',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'promo-2',
    title: 'নতুন পালাক্রমিক (ROSCA) লটারি স্কিম',
    subtitle: '১২ জন সদস্য • প্রতি মাসে ১২,০০০ টাকা ড্র!',
    category: 'অফার',
    right_widget_type: 'button',
    button_text: 'অংশ নিন ❯',
    image_url: 'https://cdn3d.iconscout.com/3d/premium/thumb/trophy-cup-3d-icon-png-download-5231649.png',
    details_image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    details_content: `### পালাক্রমিক সঞ্চয় ও লটারি সমিতি (ROSCA)

আপনি কি স্বল্পমেয়াদে বড় অংকের এককালীন নগদ টাকা প্রয়োজন মনে করছেন? তাহলে আমাদের নতুন ১২ মাসের রোটেশনাল সঞ্চয় স্কিমে অংশ নিন।

#### স্কিমের নিয়মাবলি:
১. মোট সদস্য সংখ্যা: ১২ জন।
২. মাসিক কিস্তি: ১,০০০ টাকা।
৩. প্রতি মাসের নির্ধারিত তারিখে একটি উন্মুক্ত ও নিরপেক্ষ ডিজিটাল লটারি বা সিরিয়াল অনুযায়ী ১ জন সদস্য পাবেন মোট **১২,০০০ টাকা**।
৪. যিনি একবার পুরো টাকা পেয়ে যাবেন, তিনি পরবর্তী ড্র থেকে বাদ থাকবেন কিন্তু বাকি মাসগুলোতে নিয়মিত ১,০০০ টাকা কিস্তি চালিয়ে যাবেন।
৫. ১২তম মাসে সবাই একবার করে মোট ১২,০০০ টাকা পেয়ে যাওয়ার পর সাইকেল সমাপ্ত হবে।

**অংশ নিতে অবিলম্বে অ্যাডমিনের সাথে যোগাযোগ করুন।**`,
    cta_text: 'কল করে নিশ্চিত হন',
    cta_link: 'tel:01700000000',
    cta_type: 'call',
    cta_phone: '01700000000',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'promo-3',
    title: 'যৌথ লক্ষ্য উন্নয়ন ফান্ড',
    subtitle: 'একটি মহৎ সামাজিক ও ব্যবসায়িক উদ্দেশ্যের জন্য কমন ফান্ড।',
    category: 'নোটিশ',
    right_widget_type: 'badge',
    badge_text: 'কমন ফান্ড',
    image_url: 'https://cdn3d.iconscout.com/3d/premium/thumb/community-care-3d-icon-png-download-6395982.png',
    details_content: `### যৌথ লক্ষ্য (Joint Goal) সমবায় প্রকল্প

ব্যক্তিগত সঞ্চয়ের পাশাপাশি আমাদের সমবায় সমিতি একটি সম্মিলিত তহবিল গঠনের উদ্যোগ নিয়েছে।

#### প্রকল্পের উদ্দেশ্য:
- সমিতির সদস্যদের যৌথ বিনিয়োগ অথবা জরুরি দুর্যোগকালীন সাপোর্ট ফান্ড তৈরি।
- নির্ধারিত মেয়াদ শেষে সম্মিলিত সিদ্ধান্তের ভিত্তিতে ফান্ড ব্যবহার করা হবে।
- প্রতিটি ব্যয়ের স্বচ্ছ ক্যাশ ভাউচার ও মেমো অ্যাপের ড্যাশবোর্ডে নিয়মিত আপলোড করা হবে।

**আপনার সক্রিয় অংশগ্রহণে আমাদের সমবায় আরও এক ধাপ এগিয়ে যাবে।**`,
    cta_text: 'WhatsApp এ যোগাযোগ করুন',
    cta_link: 'https://wa.me/8801700000000',
    cta_type: 'whatsapp',
    cta_phone: '01700000000',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// Helper to read promotions
function readPromotions() {
  try {
    if (fs.existsSync(promotionsFilePath)) {
      const content = fs.readFileSync(promotionsFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading promotions.json:', err);
  }
  // Initialize with defaults if missing
  fs.writeFileSync(promotionsFilePath, JSON.stringify(INITIAL_PROMOTIONS, null, 2), 'utf-8');
  return INITIAL_PROMOTIONS;
}

// Helper to write promotions
function writePromotions(data: any[]) {
  try {
    fs.writeFileSync(promotionsFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing promotions.json:', err);
    return false;
  }
}

// Initialize on server startup
readPromotions();

// Health check endpoint (for Supabase keep-alive / UptimeRobot)
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      return res.status(200).json({
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(200).json({
      status: 'error',
      message: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Centralized Sync API for Promotions (Syncs Desktop & Mobile Instantly)
app.get('/api/promotions', (req, res) => {
  const promos = readPromotions();
  const orgId = req.query.orgId as string | undefined;
  if (orgId) {
    const filtered = promos.filter((p: any) => p.organization_id === orgId || !p.organization_id);
    return res.json({ success: true, data: filtered });
  }
  res.json({ success: true, data: promos });
});

app.post('/api/promotions', (req, res) => {
  const newPromo = req.body;
  if (!newPromo || !newPromo.title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  const current = readPromotions();
  const item = {
    ...newPromo,
    id: newPromo.id || ('promo-' + Date.now()),
    created_at: newPromo.created_at || new Date().toISOString()
  };
  const updated = [item, ...current];
  writePromotions(updated);
  res.json({ success: true, data: item });
});

app.put('/api/promotions/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const current = readPromotions();
  const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
  writePromotions(updated);
  res.json({ success: true, data: updated.find(p => p.id === id) });
});

app.delete('/api/promotions/:id', (req, res) => {
  const { id } = req.params;
  const current = readPromotions();
  const updated = current.filter(p => p.id !== id);
  writePromotions(updated);
  res.json({ success: true, message: 'Deleted successfully' });
});

// View tracking endpoint
app.post('/api/promotions/:id/view', (req, res) => {
  const { id } = req.params;
  const { user_id, user_name, user_phone } = req.body || {};
  const current = readPromotions();
  const target = current.find(p => p.id === id);
  if (!target) return res.status(404).json({ success: false, message: 'Not found' });

  target.views_count = (target.views_count || 0) + 1;
  if (!Array.isArray(target.viewers)) target.viewers = [];
  
  if (user_id) {
    const existingIdx = target.viewers.findIndex((v: any) => v.user_id === user_id);
    if (existingIdx >= 0) {
      target.viewers[existingIdx].viewed_at = new Date().toISOString();
      if (user_name) target.viewers[existingIdx].user_name = user_name;
    } else {
      target.viewers.push({
        user_id,
        user_name: user_name || 'সদস্য',
        user_phone: user_phone || '',
        viewed_at: new Date().toISOString()
      });
    }
  }
  writePromotions(current);
  res.json({ success: true, data: target });
});

// Meeting attendance RSVP endpoint
app.post('/api/promotions/:id/attend', (req, res) => {
  const { id } = req.params;
  const { user_id, user_name, user_phone } = req.body || {};
  if (!user_id) return res.status(400).json({ success: false, message: 'User ID required' });
  const current = readPromotions();
  const target = current.find(p => p.id === id);
  if (!target) return res.status(404).json({ success: false, message: 'Not found' });

  if (!Array.isArray(target.attendees)) target.attendees = [];
  const existingIdx = target.attendees.findIndex((a: any) => a.user_id === user_id);
  let isAttending = false;
  
  if (existingIdx >= 0) {
    target.attendees.splice(existingIdx, 1);
    isAttending = false;
  } else {
    target.attendees.push({
      user_id,
      user_name: user_name || 'সম্মানিত সদস্য',
      user_phone: user_phone || '',
      confirmed_at: new Date().toISOString()
    });
    isAttending = true;
  }
  writePromotions(current);
  res.json({ success: true, isAttending, attendees: target.attendees });
});

// Font Settings API endpoints (Cross-device shared font preference)
app.get('/api/settings/font', (_req, res) => {
  res.json(readFontSettings());
});

app.post('/api/settings/font', (req, res) => {
  const { bangla_font } = req.body || {};
  const current = readFontSettings();
  if (bangla_font === 'solaimanlipi') {
    current.bangla_font = 'solaimanlipi';
  } else if (bangla_font === 'noto_sans_bengali') {
    current.bangla_font = 'noto_sans_bengali';
  } else if (bangla_font === 'hind_siliguri') {
    current.bangla_font = 'hind_siliguri';
  } else {
    current.bangla_font = 'system_default';
  }
  writeFontSettings(current);
  res.json({ success: true, data: current });
});

const BRANDING_SETTINGS_PATH = path.join(process.cwd(), 'data', 'branding_settings.json');

function readBrandingSettings(): { icon_url?: string } {
  try {
    if (fs.existsSync(BRANDING_SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(BRANDING_SETTINGS_PATH, 'utf-8'));
    }
  } catch {}
  return { icon_url: '/icon.svg' };
}

function writeBrandingSettings(settings: any) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(BRANDING_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving branding_settings.json:', e);
  }
}

// Branding & Display Settings API (Syncs Superadmin, Main App & DB)
app.get('/api/settings/branding', async (_req, res) => {
  try {
    const { data } = await supabase.from('app_settings').select('*').limit(1).maybeSingle();
    const fontSettings = readFontSettings();
    const brandingSettings = readBrandingSettings();
    res.json({
      success: true,
      data: {
        app_name: data?.app_name || 'আমার সমবায়',
        app_tagline: data?.app_tagline || 'সঞ্চয় ও ঋণের নির্ভরযোগ্য মাধ্যম',
        welcome_text: data?.welcome_text || 'স্বাগতম জানাই আমাদের ডিজিটাল প্ল্যাটফর্মে',
        footer_text: data?.footer_text || 'সার্বিক সহযোগিতায়: গণপ্রজাতন্ত্রী বাংলাদেশ সমবায় অধিদপ্তর',
        logo_url: data?.logo_url || '',
        icon_url: brandingSettings.icon_url || '/icon.svg',
        primary_color: data?.primary_color || '#10b981',
        secondary_color: data?.secondary_color || '#059669',
        bangla_font: fontSettings.bangla_font || data?.bangla_font || 'system_default'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/branding', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const client = authHeader ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    }) : supabase;

    const {
      app_name,
      app_tagline,
      welcome_text,
      footer_text,
      logo_url,
      icon_url,
      primary_color,
      secondary_color,
      bangla_font
    } = req.body || {};

    // 1. Sync font in font_settings.json
    if (bangla_font) {
      const current = readFontSettings();
      if (['solaimanlipi', 'noto_sans_bengali', 'hind_siliguri', 'system_default'].includes(bangla_font)) {
        current.bangla_font = bangla_font;
        writeFontSettings(current);
      }
    }

    // 2. Sync icon in branding_settings.json
    if (icon_url !== undefined) {
      const currentBranding = readBrandingSettings();
      currentBranding.icon_url = icon_url || '/icon.svg';
      writeBrandingSettings(currentBranding);
    }

    // 3. Prepare payload for app_settings table
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (app_name !== undefined) updatePayload.app_name = app_name;
    if (app_tagline !== undefined) updatePayload.app_tagline = app_tagline;
    if (welcome_text !== undefined) updatePayload.welcome_text = welcome_text;
    if (footer_text !== undefined) updatePayload.footer_text = footer_text;
    if (logo_url !== undefined) updatePayload.logo_url = logo_url;
    if (primary_color !== undefined) updatePayload.primary_color = primary_color;
    if (secondary_color !== undefined) updatePayload.secondary_color = secondary_color;
    if (bangla_font !== undefined) updatePayload.bangla_font = bangla_font;

    // Update in Supabase app_settings
    const { data: existing } = await client.from('app_settings').select('id').limit(1).maybeSingle();
    let dbUpdated = false;
    if (existing?.id) {
      const { data, error: updErr } = await client.from('app_settings').update(updatePayload).eq('id', existing.id).select();
      dbUpdated = !updErr && !!data?.length;
    } else {
      const { data, error: insErr } = await client.from('app_settings').insert([{ id: '00000000-0000-0000-0000-000000000000', ...updatePayload }]).select();
      dbUpdated = !insErr && !!data?.length;
    }

    res.json({
      success: true,
      data: updatePayload,
      dbUpdated
    });
  } catch (err: any) {
    console.error('Error saving branding settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Configure server middleware
async function setupServer() {
  app.get('/manifest.json', (_req, res) => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.sendFile(manifestPath);
  });

  const publicPath = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [path.join(process.cwd(), 'data/**')],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');
        const font = readFontSettings().bangla_font || 'solaimanlipi';
        html = html.replace('<!-- FONT_SERVER_INJECT -->', `<script>window.__SERVER_BANGLA_FONT__ = ${JSON.stringify(font)};</script>`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 সার্ভার সফলভাবে চালু হয়েছে:\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}`);
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (iface) {
        for (const alias of iface) {
          if (alias.family === 'IPv4' && !alias.internal) {
            console.log(`  ➜  Network: http://${alias.address}:${PORT}`);
          }
        }
      }
    }
    console.log('');
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
