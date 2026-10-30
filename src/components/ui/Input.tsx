import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-text-primary bangla select-none">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-text-secondary">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full h-[48px] bg-surface text-text-primary text-[14px] bangla
            border rounded-xl transition-all placeholder:text-text-subtle
            focus:outline-none focus:ring-2 disabled:bg-surface-muted disabled:opacity-60 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon ? 'pr-10' : 'pr-3.5'}
            ${error 
              ? 'border-error focus:border-error focus:ring-error/20' 
              : 'border-border focus:border-primary focus:ring-primary/20'}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-text-secondary">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-[12px] text-error font-medium bangla">
          {error}
        </span>
      ) : helperText ? (
        <span className="text-[12px] text-text-secondary bangla">
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
