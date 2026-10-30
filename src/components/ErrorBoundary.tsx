import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-container min-h-screen bg-bg-soft flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-sm border border-amber-200/60">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-[18px] font-bold text-slate-800 bangla mb-2">
            পৃষ্ঠা লোড করতে সমস্যা হয়েছে
          </h2>
          <p className="text-[13px] text-slate-500 bangla mb-6 max-w-xs">
            অ্যাপের পৃষ্ঠাটি লোড হতে সাময়িক ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              onClick={this.handleReload}
              className="w-full h-12 bg-primary text-white rounded-xl font-bold bangla text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw size={16} />
              <span>পুনরায় লোড করুন</span>
            </button>
            <button
              onClick={this.handleGoHome}
              className="w-full h-11 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold bangla text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Home size={16} />
              <span>হোমে ফিরে যান</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
