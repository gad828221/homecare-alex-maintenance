// ============ MICRO-INTERACTIONS UTILITY ============

/**
 * Add a subtle scale animation when clicking a button
 */
export const addClickAnimation = (element: HTMLElement) => {
  element.style.transform = 'scale(0.95)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 100);
};

/**
 * Show a success toast notification
 */
export const showSuccessToast = (message: string, duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/**
 * Show an error toast notification
 */
export const showErrorToast = (message: string, duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/**
 * Add a ripple effect to an element
 */
export const addRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'absolute bg-white/30 rounded-full animate-pulse pointer-events-none';

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Smooth scroll to element
 */
export const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Copy text to clipboard with feedback
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast('تم النسخ بنجاح!');
    return true;
  } catch (err) {
    showErrorToast('فشل النسخ');
    return false;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
};

/**
 * Format date in Arabic
 */
export const formatDateArabic = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};
