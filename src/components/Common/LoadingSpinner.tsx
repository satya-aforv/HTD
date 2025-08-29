import React from 'react';

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          border-t-transparent 
          border-primary 
          animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
