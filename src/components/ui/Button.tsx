import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold bangla transition-all select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark active:bg-primary-dark text-white shadow-sm',
    secondary: 'bg-primary-light hover:bg-primary-subtle text-primary',
    outline: 'bg-transparent border border-border hover:bg-slate-50 text-text-primary shadow-xs',
    ghost: 'bg-transparent hover:bg-slate-100 text-text-secondary hover:text-text-primary',
    danger: 'bg-error hover:bg-red-700 text-white shadow-sm',
  }[variant];

  const sizeClasses = {
    sm: 'h-[36px] px-3 text-[12px] rounded-xl gap-1.5',
    md: 'h-[44px] px-4 text-[14px] rounded-xl gap-2',
    lg: 'h-[48px] px-5 text-[15px] rounded-xl gap-2',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 18} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
