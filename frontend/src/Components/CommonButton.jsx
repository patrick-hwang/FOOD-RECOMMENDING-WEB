// src/components/CommonButton.jsx
import React from 'react';
import './CommonButton.css';

export default function CommonButton({ text, onClick, className = '' }) {
  return (
    <button 
      className={`common-btn ${className}`} 
      onClick={onClick}
    >
      {text}
    </button>
  );
}