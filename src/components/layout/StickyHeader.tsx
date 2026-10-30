import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTheme } from '../ThemeProvider';

export interface StickyHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  backTo?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backTo,
  showBack,
  rightAction,
  className = ''
}) => {
  const navigate = useNavigate();
  const settings = useSettingsStore(state => state.settings);
  const theme = useTheme();

  // Dynamically resolve Brand Theme Colors configured in the Admin Panel
  const primaryColor = settings?.primary_color || theme?.primary || '#087F5B';

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // If the browser session has previous in-app history, return to origin
    if (typeof window !== 'undefined' && window.history?.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (backTo) {
      navigate(backTo, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const hasBack = showBack !== undefined ? showBack : Boolean(onBack || backTo);

  return (
    <>
      <header
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 h-[56px] shadow-sm flex items-center text-white transition-all duration-200 select-none ${className}`}
        style={{
          backgroundColor: primaryColor
        }}
      >
        <div className="relative w-full h-full flex items-center justify-between px-2.5 sm:px-3">
          {/* Left Slot (Back action - 44x44px touch target, no background shape/border) */}
          <div className="flex items-center min-w-[44px] z-10 shrink-0">
            {hasBack && (
              <button
                type="button"
                onClick={handleBack}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white active:scale-90 transition-transform -ml-1 focus:outline-none cursor-pointer"
                title="পেছনে যান"
                aria-label="পেছনে যান"
              >
                <ArrowLeft size={22} strokeWidth={2.4} className="text-white drop-shadow-xs" />
              </button>
            )}
          </div>

          {/* Center Slot (Title & Subtitle - Center-aligned across all pages) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-14 sm:px-16 pointer-events-none z-0">
            <h1 className="text-[17px] sm:text-[18px] font-bold text-white bangla leading-tight truncate max-w-full text-center tracking-normal drop-shadow-xs">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-white/85 font-medium bangla leading-none truncate max-w-full text-center mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Slot (Action buttons / controls - no background shapes, min 44x44px touch targets) */}
          <div className="flex items-center justify-end min-w-[44px] z-10 shrink-0 gap-0.5 header-action-slot">
            {rightAction}
          </div>
        </div>
      </header>
      {/* Spacer to reserve exact height for fixed header across mobile and desktop */}
      <div className="w-full h-[56px] shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
};
