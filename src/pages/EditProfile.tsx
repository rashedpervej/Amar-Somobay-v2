import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/layout/MobileLayout';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../components/ThemeProvider';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  ChevronDown,
  User, 
  Camera,
  Phone,
  Mail, 
  Loader2, 
  CheckCircle2,
  Save,
  Lock,
  Upload,
  MapPin,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropUtils';
import { BD_DIVISIONS, BD_DISTRICTS, BD_UPAZILAS, BD_UNIONS, getUnionsByDistrictAndUpazila, cleanUnionName } from '../data/bdGeo';

export default function EditProfile() {
  const navigate = useNavigate();
  const profile = useAuthStore(state => state.profile);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const updatePassword = useAuthStore(state => state.updatePassword);
  const user = useAuthStore(state => state.user);
  const memberships = useAuthStore(state => state.memberships);
  const activeOrganization = useAuthStore(state => state.activeOrganization);
  const activeRole = useAuthStore(state => state.activeRole);

  const hasActiveMembership = (memberships && memberships.some(m => m.status === 'active' && m.organization?.status === 'active')) ||
                              (activeOrganization?.status === 'active' && activeRole === 'member');
  const isCoopAdmin = (activeRole === 'cooperative_admin' || profile?.role === 'admin') && 
                      activeOrganization?.status === 'active';
  const isPending = profile?.role === 'pending' || (!hasActiveMembership && !isCoopAdmin && profile?.role !== 'admin');

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [step, setStep] = useState(1);
  const [isCustomUnion, setIsCustomUnion] = useState(false);
  const [show100Celebration, setShow100Celebration] = useState(false);

  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const BENGALI_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  const currentYear = new Date().getFullYear();
  const DOB_YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const DOB_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    phone: '',
    phone_verified: false,
    gender: '',
    date_of_birth: '',
    division: '',
    district: '',
    upazila: '',
    union_pouro: '',
    village: ''
  });

  // Sync DOB dropdowns from formData.date_of_birth
  useEffect(() => {
    if (formData.date_of_birth) {
      const [y, m, d] = formData.date_of_birth.split('-');
      setDobYear(y || '');
      setDobMonth(m ? String(parseInt(m, 10)) : '');
      setDobDay(d ? String(parseInt(d, 10)) : '');
    }
  }, [formData.date_of_birth]);

  const updateDob = (day: string, month: string, year: string) => {
    setDobDay(day); setDobMonth(month); setDobYear(year);
    if (day && month && year) {
      const dd = String(day).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      setFormData(p => ({ ...p, date_of_birth: `${year}-${mm}-${dd}` }));
    } else {
      setFormData(p => ({ ...p, date_of_birth: '' }));
    }
  };

  // Cascading address options (derived from formData)
  const districtOptions = formData.division ? (BD_DISTRICTS[formData.division] || []) : [];
  const upazilaOptions = formData.district ? (BD_UPAZILAS[formData.district] || []) : [];
  const unionOptions = (formData.district && formData.upazila)
    ? getUnionsByDistrictAndUpazila(formData.district, formData.upazila)
    : (formData.upazila ? getUnionsByDistrictAndUpazila('', formData.upazila) : []);

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Sync with profile when it loads
  useEffect(() => {
    if (profile) {
      const upazila = profile.upazila || '';
      const district = profile.district || '';
      const union_pouro = profile.union_pouro || '';

      setFormData({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        phone_verified: !!profile.phone_verified,
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        division: profile.division || '',
        district,
        upazila,
        union_pouro,
        village: profile.village || ''
      });

      if (union_pouro) {
        const unions = getUnionsByDistrictAndUpazila(district, upazila);
        const cleanSaved = cleanUnionName(union_pouro);
        if (unions.includes(cleanSaved)) {
          setFormData(p => ({ ...p, union_pouro: cleanSaved }));
          setIsCustomUnion(false);
        } else if (unions.length > 0) {
          setIsCustomUnion(true);
        } else {
          setIsCustomUnion(false);
        }
      } else {
        setIsCustomUnion(false);
      }
    }
  }, [profile]);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'ছবির সাইজ ৫ মেগাবাইটের কম হতে হবে', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;

    setUploading(true);
    setImageSrc(null); // Close cropper
    
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Could not crop image');

      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ text: 'ছবি আপলোড সফল হয়েছে', type: 'success' });
    } catch (err: any) {
      console.error('Crop/Upload error:', err);
      setMessage({ text: 'আপলোড ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const calculateDynamicPercentage = (data: typeof formData) => {
    let score = 0;
    // Identity fields (max 35)
    if (data.full_name?.trim()) score += 25;
    if (data.gender) score += 5;
    if (data.date_of_birth) score += 5;

    // Photo field (max 25)
    if (data.avatar_url?.trim()) score += 25;

    // Address fields (max 40)
    if (data.division) score += 10;
    if (data.district) score += 10;
    if (data.upazila) score += 10;
    if (data.union_pouro || data.village) score += 10;

    return Math.min(100, Math.max(0, score));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      setMessage({ text: 'নাম আবশ্যিক', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Update Profile info
      await updateProfile({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
        phone: formData.phone || undefined,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        division: formData.division || null,
        district: formData.district || null,
        upazila: formData.upazila || null,
        union_pouro: formData.union_pouro || null,
        village: formData.village || null
      } as any);

      const score = calculateDynamicPercentage(formData);
      if (score >= 100) {
        setShow100Celebration(true);
        setTimeout(() => {
          const targetRoute = isPending ? '/pending' : '/settings';
          navigate(targetRoute);
        }, 3000);
      } else {
        setMessage({ text: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে', type: 'success' });
        const targetRoute = isPending ? '/pending' : '/settings';
        setTimeout(() => navigate(targetRoute), 1500);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'আপডেট করতে ত্রুটি হয়েছে', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      headerTitle="প্রোফাইল সম্পাদন"
      showBack={true}
      backTo={isPending ? '/pending' : '/settings'}
      showNav={!isPending}
    >
      <div className="flex flex-col gap-4">
        {/* Avatar Section */}
        <div className="bg-white rounded-[20px] p-5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center gap-3">
          <div className="w-24 h-24 bg-slate-50 rounded-full border-2 border-dashed border-border flex items-center justify-center relative group">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="text-slate-300" size={40} />
            )}
            
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-md flex items-center justify-center cursor-pointer border-2 border-white bg-primary text-white active:scale-90 transition-transform z-20"
            >
              <Camera size={14} />
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-slate-800 font-bold bangla text-[15px]">প্রোফাইল ছবি</h3>
            <p className="text-[12px] text-slate-400 bangla mt-0.5">ছবি পরিবর্তনের জন্য ক্যামেরায় চাপ দিন</p>
          </div>
        </div>

        {/* Form Section - Wizard (Save & Next) */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 pb-10">
          {/* Step indicator */}
          <div className="flex items-center gap-2 px-1">
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-slate-200'}`} />
          </div>
          <p className="text-[11px] text-slate-500 bangla text-center">ধাপ {step} / 2</p>

          <div className="bg-white rounded-[20px] p-4.5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-4">
            {step === 1 && (
              <>
                {/* Section: Personal Info */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-[12px] font-bold text-primary bangla uppercase tracking-wide">ব্যক্তিগত তথ্য</h4>
                </div>

                {/* Full Name (required) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">পূর্ণ নাম *</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      value={formData.full_name}
                      onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                      required
                      className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-3 pl-10 bangla text-[14px] font-medium outline-none text-slate-800 focus:border-primary"
                    />
                    <User className="absolute left-3.5 text-slate-400" size={16} />
                  </div>
                </div>

                {/* Mobile (read-only + verify) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">মোবাইল নম্বর *</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center flex-1">
                      <input 
                        type="tel" 
                        value={formData.phone}
                        readOnly
                        className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-3 pl-10 bangla text-[14px] font-medium outline-none text-slate-800"
                      />
                      <Phone className="absolute left-3.5 text-slate-400" size={16} />
                    </div>
                    {formData.phone_verified ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg bangla whitespace-nowrap">✓ যাচাইকৃত</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, phone_verified: true }))}
                        className="text-[11px] font-bold text-white bg-primary px-2.5 py-1.5 rounded-lg bangla whitespace-nowrap active:scale-95 transition-all"
                      >
                        যাচাই করুন
                      </button>
                    )}
                  </div>
                  {!formData.phone_verified && (
                    <p className="text-[11px] text-amber-700 bangla">মোবাইল নম্বর যাচাই করা হয়নি। যাচাই করুন।</p>
                  )}
                </div>

                {/* Email (read-only, if present) */}
                {profile?.email && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 bangla">ইমেইল</label>
                    <div className="relative flex items-center">
                      <input 
                        type="email" 
                        value={profile.email}
                        readOnly
                        className="w-full bg-bg-soft border border-border rounded-xl px-3.5 py-3 pl-10 bangla text-[14px] font-medium outline-none text-slate-500"
                      />
                      <Mail className="absolute left-3.5 text-slate-400" size={16} />
                    </div>
                  </div>
                )}

                {/* Gender (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">লিঙ্গ (ঐচ্ছিক)</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.gender}
                      onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                      className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 pr-10 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value="male">পুরুষ</option>
                      <option value="female">মহিলা</option>
                      <option value="other">অন্যান্য</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Date of Birth (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">জন্মতারিখ (ঐচ্ছিক)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative flex items-center">
                      <select
                        value={dobDay}
                        onChange={e => updateDob(e.target.value, dobMonth, dobYear)}
                        className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-2.5 pr-7 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                      >
                        <option value="">দিন</option>
                        {DOB_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative flex items-center">
                      <select
                        value={dobMonth}
                        onChange={e => updateDob(dobDay, e.target.value, dobYear)}
                        className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-2.5 pr-7 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                      >
                        <option value="">মাস</option>
                        {BENGALI_MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative flex items-center">
                      <select
                        value={dobYear}
                        onChange={e => updateDob(dobDay, dobMonth, e.target.value)}
                        className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-2.5 pr-7 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                      >
                        <option value="">বছর</option>
                        {DOB_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Section: Address */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-[12px] font-bold text-primary bangla uppercase tracking-wide">ঠিকানা (ঐচ্ছিক)</h4>
                </div>

                {/* Division */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">বিভাগ</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.division}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => ({
                          ...p,
                          division: val,
                          district: '',
                          upazila: '',
                          union_pouro: ''
                        }));
                        setIsCustomUnion(false);
                      }}
                      className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 pr-10 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {BD_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* District */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">জেলা</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.district}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => ({
                          ...p,
                          district: val,
                          upazila: '',
                          union_pouro: ''
                        }));
                        setIsCustomUnion(false);
                      }}
                      disabled={!formData.division}
                      className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 pr-10 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary disabled:opacity-50 appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">
                        {!formData.division ? 'প্রথমে বিভাগ নির্বাচন করুন' : 'নির্বাচন করুন'}
                      </option>
                      {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Upazila */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">উপজেলা</label>
                  <div className="relative flex items-center">
                    <select
                      value={formData.upazila}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(p => ({
                          ...p,
                          upazila: val,
                          union_pouro: ''
                        }));
                        setIsCustomUnion(false);
                      }}
                      disabled={!formData.district}
                      className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 pr-10 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary disabled:opacity-50 appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">
                        {!formData.district ? 'প্রথমে জেলা নির্বাচন করুন' : 'নির্বাচন করুন'}
                      </option>
                      {upazilaOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Union/Pouroshova */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">ইউনিয়ন/পৌরসভা</label>
                  <div className="relative flex items-center">
                    <select
                      value={
                        isCustomUnion
                          ? '__other__'
                          : unionOptions.includes(formData.union_pouro)
                          ? formData.union_pouro
                          : unionOptions.includes(cleanUnionName(formData.union_pouro))
                          ? cleanUnionName(formData.union_pouro)
                          : formData.union_pouro
                          ? '__other__'
                          : ''
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__other__') {
                          setIsCustomUnion(true);
                          // If current value was from the dropdown, clear so user can type freely
                          if (unionOptions.includes(formData.union_pouro)) {
                            setFormData(p => ({ ...p, union_pouro: '' }));
                          }
                        } else {
                          setIsCustomUnion(false);
                          setFormData(p => ({ ...p, union_pouro: val }));
                        }
                      }}
                      disabled={!formData.upazila}
                      className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 pr-10 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary disabled:opacity-50 appearance-none cursor-pointer active:bg-slate-100/70 transition-colors"
                    >
                      <option value="">
                        {!formData.upazila ? 'প্রথমে উপজেলা নির্বাচন করুন' : 'নির্বাচন করুন'}
                      </option>
                      {unionOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      <option value="__other__">অন্যান্য (লিখুন)</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
                  {(isCustomUnion || (formData.union_pouro && !unionOptions.includes(formData.union_pouro))) && (
                    <input 
                      type="text" 
                      value={formData.union_pouro}
                      onChange={e => setFormData(p => ({ ...p, union_pouro: e.target.value }))}
                      placeholder="ইউনিয়ন/পৌরসভার নাম লিখুন"
                      autoFocus={isCustomUnion && !formData.union_pouro}
                      className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary mt-2"
                    />
                  )}
                </div>

                {/* Village/Area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 bangla">গ্রাম/এলাকা</label>
                  <input 
                    type="text" 
                    value={formData.village}
                    onChange={e => setFormData(p => ({ ...p, village: e.target.value }))}
                    placeholder="যেমন: নবীনগর"
                    className="w-full min-h-[48px] bg-bg-soft border border-border rounded-xl px-3.5 py-3 bangla text-[15px] font-medium outline-none text-slate-800 focus:border-primary"
                  />
                </div>
              </>
            )}
          </div>

          {message.text && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-[13px] bangla font-semibold ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-primary' 
                  : 'bg-rose-50 border-rose-200 text-[#DC2626]'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <div className="flex gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 px-4 rounded-[16px] font-semibold text-[15px] bangla active:scale-[0.98] transition-all"
              >
                পূর্ববর্তী
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 px-4 rounded-[16px] font-semibold text-[15px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                পরবর্তী
              </button>
            )}
            {step === 2 && (
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3.5 px-4 rounded-[16px] font-semibold text-[15px] bangla flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                <span>সংরক্ষণ করুন</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {imageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-lg" 
              onClick={() => setImageSrc(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-bold bangla text-slate-800 dark:text-slate-100">ছবি ক্রপ করুন</h3>
                <button onClick={() => setImageSrc(null)} className="p-2 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="relative h-[400px] w-full bg-slate-900">
                <Cropper
                  image={imageSrc}
                   crop={crop}
                   zoom={zoom}
                   aspect={1}
                   onCropChange={setCrop}
                   onCropComplete={onCropComplete}
                   onZoomChange={setZoom}
                   cropShape="round"
                   showGrid={false}
                   objectFit="cover"
                />
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>জুম</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={0.8}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                    style={{ '--tw-accent-color': theme.primary } as any}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setImageSrc(null)}
                    className="flex-1 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 font-bold bangla active:scale-95 transition-all"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    className="flex-1 h-14 rounded-2xl text-white font-bold bangla flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                    style={{ backgroundColor: theme.primary, boxShadow: `0 8px 20px -4px ${theme.primary}40` }}
                  >
                    <Check size={20} strokeWidth={3} />
                    নিশ্চিত করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cute 100% Celebration Modal */}
      <AnimatePresence>
        {show100Celebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 18, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 text-center overflow-hidden"
            >
              {/* Soft colorful background blurs */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/50 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />

              {/* Cute Graphic with glowing rings & animation */}
              <div className="relative mx-auto w-24 h-24 mb-3.5 flex items-center justify-center">
                {/* Rotating decorative dotted ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/80"
                />
                
                {/* Center Badge */}
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-[#1b7a54] to-emerald-400 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-600/30">
                  <PartyPopper size={30} className="text-amber-200 mb-0.5 animate-bounce" />
                  <span className="text-[14px] font-black tracking-tight leading-none">১০০%</span>
                </div>

                {/* Sparkling floating badges */}
                <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-1.5 shadow-md shadow-amber-400/40 animate-pulse">
                  <Sparkles size={13} />
                </div>
                <div className="absolute -bottom-1 -left-1 bg-teal-500 text-white rounded-full p-1.5 shadow-md shadow-teal-500/40">
                  <CheckCircle2 size={13} />
                </div>
              </div>

              {/* Typography */}
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black bangla mb-2 tracking-wide uppercase">
                অভিনন্দন! 🎉
              </span>
              <h3 className="text-[18px] font-black text-slate-900 bangla leading-snug">
                আপনার প্রোফাইল ১০০% সম্পূর্ণ হয়েছে!
              </h3>
              <p className="text-[12.5px] text-slate-500 bangla mt-2 leading-relaxed">
                আপনার সমস্ত তথ্য সফলভাবে পূরণ ও সংরক্ষিত হয়েছে। এবার নিশ্চিন্তে সমিতি তৈরি করুন বা সমিতিতে যোগ দিন।
              </p>

              {/* Action Button */}
              <div className="mt-5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShow100Celebration(false);
                    const targetRoute = isPending ? '/pending' : '/settings';
                    navigate(targetRoute);
                  }}
                  className="w-full py-3.5 px-4 bg-[#1b7a54] hover:bg-[#166344] active:scale-[0.98] text-white rounded-2xl font-bold text-[14px] bangla shadow-md shadow-emerald-700/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>এগিয়ে যান</span>
                  <Sparkles size={16} className="text-amber-200" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
