import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for smart, reliable back navigation across mobile & desktop.
 * If the user has in-app history in this browsing session, it safely navigates back (-1).
 * If the page was opened directly via URL or on refresh, it falls back to the safe fallback path.
 */
export function useAppBack(defaultFallback: string = '/dashboard') {
  const navigate = useNavigate();

  return (overrideFallback?: string) => {
    const fallback = overrideFallback || defaultFallback;
    
    // Check if window history state has an internal stack index > 0
    if (typeof window !== 'undefined' && window.history?.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}
