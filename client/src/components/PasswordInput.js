import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PasswordInput = ({ id, name, value, onChange, placeholder, required, className, disabled }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || '••••••••'}
        required={required}
        disabled={disabled}
        className={`pr-10 ${className || 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent'}`}
      />
      <button
        type="button"
        onClick={() => setShow(prev => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  );
};

export default PasswordInput;
