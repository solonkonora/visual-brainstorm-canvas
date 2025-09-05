'use client';

import React from 'react';
import DrawingBoard from '../components/DrawingBoard';

const CanvasPage: React.FC = () => {
  return (
    <div className="h-screen w-full">
      <DrawingBoard />
    </div>
  );
};

export default CanvasPage;
