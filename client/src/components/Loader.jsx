import React from 'react';

/**
 * ExpenseX Premium Fintech Loader
 * Pure CSS • Transparent • No External Dependencies
 */
export default function Loader({ size = 'lg', label, className = '' }) {
  const SIZES = {
    sm: { width: 36, height: 36, scale: 0.5 },
    md: { width: 54, height: 54, scale: 0.75 },
    lg: { width: 72, height: 72, scale: 1 },
  };

  const currentSize = SIZES[size] || SIZES.lg;

  // Simple minimal rendering if default size & no label
  if (size === 'lg' && !label && !className) {
    return (
      <div
        className="expensex-loader"
        role="status"
        aria-label="Loading"
      />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        style={{
          width: currentSize.width,
          height: currentSize.height,
        }}
        className="relative flex items-center justify-center overflow-visible"
      >
        <div
          style={{
            transform: `scale(${currentSize.scale})`,
            transformOrigin: 'center center',
          }}
          className="flex items-center justify-center shrink-0"
        >
          <div
            className="expensex-loader"
            role="status"
            aria-label={label || 'Loading'}
          />
        </div>
      </div>

      {label && (
        <span className="text-xs font-semibold text-slate-400 tracking-wide animate-pulse select-none">
          {label}
        </span>
      )}
    </div>
  );
}
