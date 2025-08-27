import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helper,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  onIconClick,
  ...props
}, ref) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            input-field
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}
            ${className}
          `}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div 
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${onIconClick ? 'cursor-pointer' : 'pointer-events-none'}`}
            onClick={onIconClick}
          >
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 animate-slide-down">{error}</p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-neutral-500">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
