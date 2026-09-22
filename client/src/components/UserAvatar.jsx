import React, { useState } from 'react';

/**
 * Robust UserAvatar Component for ExpenseX
 * - Uses user?.profilePicture or fallback Dicebear avatar
 * - Includes referrerPolicy="no-referrer" to prevent 403 Forbidden from Google CDN
 * - Features graceful onError fallback to stylized initials badge if image fails to load
 */
export default function UserAvatar({
  src,
  name = 'User',
  size = 'sm',
  className = '',
  ring = false,
  rounded = 'rounded-full',
}) {
  const [hasError, setHasError] = useState(false);

  // Size mapping
  const sizeMap = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const selectedSizeClass = sizeMap[size] || sizeMap.sm;

  // Compute 1-2 letter initials from user's name
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Target image source
  const imageSource = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`;

  if (hasError) {
    return (
      <div
        className={`${selectedSizeClass} ${rounded} bg-gradient-to-tr from-brand-600 via-indigo-600 to-teal-500 text-white font-bold flex items-center justify-center select-none shadow-sm flex-shrink-0 ${
          ring ? 'ring-2 ring-brand-500/40' : ''
        } ${className}`}
        title={name}
        aria-label={name}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={imageSource}
      alt={name || 'User'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${selectedSizeClass} ${rounded} object-cover bg-slate-800 border border-white/10 flex-shrink-0 shadow-sm ${
        ring ? 'ring-2 ring-brand-500/40' : ''
      } ${className}`}
    />
  );
}
