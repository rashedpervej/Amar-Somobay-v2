import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Trophy, HandCoins, Bell, ArrowRight } from 'lucide-react';
import { Promotion } from '../store/usePromotionStore';

interface PromotionalCardProps {
  promo: Promotion;
  totalCards?: number;
  currentIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onClick?: () => void;
  previewMode?: boolean;
}

export const PromotionalCard: React.FC<PromotionalCardProps> = ({
  promo,
  totalCards = 1,
  currentIndex = 0,
  onNext,
  onPrev,
  onClick,
  previewMode = false
}) => {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);

  const handleClick = () => {
    if (previewMode) return;
    if (onClick) {
      onClick();
    } else {
      navigate(`/promotions/${promo.id}`);
    }
  };

  // Determine widget type (default intelligently if not specified)
  const widgetType = promo.right_widget_type || 
    (promo.progress_percent !== undefined ? 'progress' : 
     promo.badge_text ? 'badge' : 
     promo.button_text ? 'button' : 'progress');

  return (
    <div 
      onClick={handleClick}
      className={`relative w-full bg-[#110d29] rounded-[22px] p-2.5 px-3.5 sm:px-4.5 flex items-center border border-white/10 overflow-hidden shadow-2xl group transition-transform ${
        previewMode ? 'cursor-default' : 'cursor-pointer active:scale-[0.99] hover:scale-[1.01]'
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-[-10px] -translate-y-1/2 w-28 h-28 rounded-full bg-indigo-500/15 blur-xl pointer-events-none" />
      <div className="absolute top-1/2 right-[-20px] -translate-y-1/2 w-24 h-24 rounded-full bg-purple-500/15 blur-xl pointer-events-none" />

      {/* Main card content container */}
      <div className="flex items-center w-full gap-2.5 relative z-10 justify-between">
        
        {/* Left section: 3D Illustration / Vector & Text */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          
          {/* Illustration Container */}
          <div className="shrink-0 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
            {promo.image_url && !imgErr ? (
              <img 
                src={promo.image_url} 
                alt={promo.title} 
                className="w-[72px] h-[72px] sm:w-[86px] sm:h-[86px] object-contain drop-shadow-md select-none" 
                onError={() => setImgErr(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              /* High-fidelity Vector Fallback: Concentric Target, Coins & Arrow */
              <div className="w-[72px] h-[72px] sm:w-[86px] sm:h-[86px] select-none">
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <defs>
                    <radialGradient id="target-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </radialGradient>
                    <filter id="vector-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodOpacity="0.5" />
                    </filter>
                  </defs>
                  
                  <circle cx="80" cy="80" r="60" fill="url(#target-glow)" />
                  
                  {/* Sprout Green leaves background */}
                  <path d="M40 70 C30 55, 35 35, 52 42 C50 55, 45 65, 40 70 Z" fill="#22c55e" filter="url(#vector-shadow)" opacity="0.95" />
                  <path d="M40 70 C43 55, 48 48, 52 42" stroke="#15803d" strokeWidth="1" strokeLinecap="round" />
                  <path d="M35 85 C22 75, 20 58, 36 62 C38 72, 38 78, 35 85 Z" fill="#4ade80" filter="url(#vector-shadow)" opacity="0.9" />
                  <path d="M125 110 C132 100, 130 90, 122 88 C120 95, 122 105, 125 110 Z" fill="#16a34a" filter="url(#vector-shadow)" opacity="0.9" />

                  {/* Target ring */}
                  <g transform="rotate(-15 80 80)">
                    {/* Blue Rim */}
                    <circle cx="80" cy="80" r="42" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" filter="url(#vector-shadow)" />
                    {/* White Ring */}
                    <circle cx="80" cy="80" r="32" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    {/* Blue Center Outer */}
                    <circle cx="80" cy="80" r="22" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
                    {/* Inner White */}
                    <circle cx="80" cy="80" r="13" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                    {/* Blue Center absolute bullseye */}
                    <circle cx="80" cy="80" r="6" fill="#1d4ed8" />
                  </g>

                  {/* Gold coins stack at bottom left */}
                  <g filter="url(#vector-shadow)">
                    <ellipse cx="50" cy="115" rx="14" ry="4.5" fill="#ca8a04" />
                    <path d="M36 115 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                    <ellipse cx="50" cy="111" rx="14" ry="4.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
                    
                    <ellipse cx="50" cy="107" rx="14" ry="4.5" fill="#ca8a04" />
                    <path d="M36 107 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                    <ellipse cx="50" cy="103" rx="14" ry="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
                  </g>

                  {/* Front stack of coin cylinders */}
                  <g filter="url(#vector-shadow)">
                    <ellipse cx="72" cy="122" rx="14" ry="4.5" fill="#ca8a04" />
                    <path d="M58 122 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                    <ellipse cx="72" cy="118" rx="14" ry="4.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />

                    <ellipse cx="72" cy="114" rx="14" ry="4.5" fill="#ca8a04" />
                    <path d="M58 114 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                    <ellipse cx="72" cy="110" rx="14" ry="4.5" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
                    
                    <ellipse cx="72" cy="106" rx="14" ry="4.5" fill="#ca8a04" />
                    <path d="M58 106 v-4 a 14 4.5 0 0 0 28 0 v 4 Z" fill="#eab308" />
                    <ellipse cx="72" cy="102" rx="14" ry="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
                  </g>

                  {/* Arrow hitting Center */}
                  <g filter="url(#vector-shadow)">
                    <line x1="135" y1="30" x2="84" y2="76" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
                    <path d="M123 35 L132 27 L138 31 L131 42 Z" fill="#3b82f6" />
                    <path d="M117 40 L126 32 L132 36 L125 47 Z" fill="#1d4ed8" />
                    <polygon points="85,73 80,80 88,80" fill="#475569" />
                  </g>

                  {/* Fine Sparkles */}
                  <g transform="translate(115, 60)">
                    <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill="#fef08a" />
                  </g>
                  <g transform="translate(25, 30)">
                    <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="#fef08a" opacity="0.8" />
                  </g>
                </svg>
              </div>
            )}
          </div>

          {/* Texts Details area (Clean, no category tag) */}
          <div className="flex-1 flex flex-col min-w-0">
            <h4 className="text-[14px] xs:text-[15px] sm:text-[17px] font-bold text-white bangla flex items-center gap-1 leading-snug truncate">
              {promo.title}
            </h4>
            <div className="text-[11px] xs:text-[11.5px] sm:text-[13px] text-slate-300/80 bangla leading-snug mt-0.5 line-clamp-2">
              {promo.subtitle.split('\n').map((line, idx) => (
                <p key={idx} className="truncate">{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Admin Controlled Widget */}
        {widgetType === 'progress' && (
          <div className="shrink-0 flex flex-col items-end justify-center text-right select-none pr-0.5 min-w-[76px] sm:min-w-[88px]">
            <span className="text-[11px] xs:text-[12px] sm:text-[13px] text-slate-200 font-bold bangla whitespace-nowrap">
              {promo.target_text || 'লক্ষ্য: ৳১২,০০০'}
            </span>
            <div className="mt-1 sm:mt-1.5 w-full">
              <div className="h-[6px] sm:h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(8, promo.progress_percent ?? 80))}%` }} 
                />
              </div>
            </div>
          </div>
        )}

        {widgetType === 'button' && (
          <div className="shrink-0 flex items-center justify-end select-none pr-0.5">
            <button 
              type="button"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-[11px] sm:text-[12px] font-bold bangla whitespace-nowrap shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>{promo.button_text || 'বিস্তারিত দেখুন'}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {widgetType === 'badge' && (
          <div className="shrink-0 flex items-center justify-end select-none pr-0.5">
            <span className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] sm:text-[12px] font-bold bangla whitespace-nowrap shadow-sm">
              {promo.badge_text || 'বিশেষ অফার'}
            </span>
          </div>
        )}

        {widgetType === 'none' && (
          <div className="shrink-0 opacity-0 w-1" />
        )}

      </div>

      {/* Subtle indicator for multiple active banners */}
      {totalCards > 1 && !previewMode && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onNext) onNext();
          }}
          className="absolute bottom-1 right-2.5 z-20 flex items-center gap-1 text-[9px] text-purple-300/70 hover:text-white bangla cursor-pointer transition-colors px-1 py-0.5"
          title="পরবর্তী ব্যানার"
        >
          <span>{currentIndex + 1}/{totalCards}</span>
          <ChevronRight size={10} />
        </div>
      )}
    </div>
  );
};
