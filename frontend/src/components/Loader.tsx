// components/Loader.tsx
import React from 'react';
import '../index.css';

const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <span className="loader"></span>
    </div>
  );
};

export default Loader;
