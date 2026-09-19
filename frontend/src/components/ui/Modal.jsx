import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

function Modal({ children, isOpen, onCancel, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onCancel) {
        onCancel();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div 
        className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div 
        className={`relative w-full ${maxWidth} my-auto z-10 animate-scale-in flex flex-col`}
      >
        {/* Invisible click buffer extending ~48px outside modal box without affecting box dimensions */}
        <div 
          className="absolute -inset-8 sm:-inset-14 rounded-[3rem] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Visible Premium Modal Card */}
        <div 
          className="relative w-full bg-brand-card/95 border border-brand-border/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[85vh] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-20 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;