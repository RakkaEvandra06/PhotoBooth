// src/components/FlashOverlay.tsx

import React from 'react';

interface Props {
  show: boolean;
}

export const FlashOverlay: React.FC<Props> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-40 bg-white animate-flash pointer-events-none" />
  );
};
