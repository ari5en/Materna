import React from 'react';

export function LotusIcon({
  className = 'w-6 h-6',
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/materna-logo.png"
      alt="Materna Logo"
      className={`inline-block object-contain select-none shrink-0 ${className}`}
    />
  );
}
