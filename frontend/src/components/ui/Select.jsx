import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

function Select({ label, value, onChange, children, className = '', name }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse children to get options
  const options = React.Children.toArray(children).map(child => {
    if (child && child.type === 'option') {
      return {
        value: child.props?.value,
        label: child.props?.children,
        key: child.key || child.props?.value
      };
    }
    return null;
  }).filter(Boolean);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    // Create a synthetic event to match the expected interface
    const event = {
      target: {
        name: name,
        value: option.value
      }
    };
    onChange(event);
    setIsOpen(false);
  };

  return (
    <div className={twMerge("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2 ml-1">
          {label}
        </label>
      )}
      <div
        className="relative cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={twMerge(
            "flex items-center justify-between w-full p-3 bg-brand-dark border border-brand-border rounded-xl text-white transition-all",
            "group-hover:border-gray-500",
            isOpen && "border-brand-primary ring-1 ring-brand-primary"
        )}>
            <span className={twMerge("text-sm", !selectedOption && "text-text-muted")}>
                {selectedOption ? selectedOption.label : t('common.select')}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-[#1E1E2E] border border-gray-700 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            {options.map((option) => (
              <div
                key={option.key}
                className={twMerge(
                  "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                  String(option.value) === String(value) 
                    ? "bg-brand-primary text-white" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => handleSelect(option)}
              >
                <span>{option.label}</span>
                {String(option.value) === String(value) && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ))}
            {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    {t('common.noOptions')}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Select;
