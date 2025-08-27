import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-soft hover:shadow-medium hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 transform hover:scale-105',
    secondary: 'text-primary-700 bg-primary-50 shadow-soft hover:bg-primary-100 hover:shadow-medium focus:ring-primary-500 transform hover:scale-105',
    outline: 'text-primary-700 border-2 border-primary-200 shadow-soft hover:bg-primary-50 hover:border-primary-300 hover:shadow-medium focus:ring-primary-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'text-white bg-gradient-to-r from-red-600 to-red-700 shadow-soft hover:shadow-medium hover:from-red-700 hover:to-red-800 focus:ring-red-500 transform hover:scale-105',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${isDisabled ? 'transform-none hover:scale-100' : ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={`w-4 h-4 ${children ? 'mr-2' : ''}`} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon className={`w-4 h-4 ${children ? 'ml-2' : ''}`} />
          )}
        </>
      )}
    </button>
  );
};

export default Button;
