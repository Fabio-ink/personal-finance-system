import React from 'react';
import Card from './Card';

function Modal({ children, isOpen, onCancel, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <Card 
        className={`w-full ${maxWidth} p-6 bg-brand-card border border-brand-border/50 shadow-2xl rounded-2xl scale-100 animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Card>
    </div>
  );
}

export default Modal;