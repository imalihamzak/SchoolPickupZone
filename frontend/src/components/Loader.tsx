// components/Loader.tsx
import React from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <LoadingSpinner size="lg" label="Loading" />
    </div>
  );
};

export default Loader;
