import React from 'react';
import { ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react';

const variants = {
  success: {
    baseClass: 'bg-brand-success/10 border-brand-success/20 text-brand-success hover:bg-brand-success hover:border-brand-success hover:text-brand-dark hover:shadow-brand-success/30',
    iconClass: 'border-brand-success text-brand-success bg-transparent group-hover:bg-brand-dark group-hover:border-brand-success group-hover:text-brand-success',
    Icon: ArrowUp
  },
  primary: {
    baseClass: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:border-brand-primary hover:text-brand-dark hover:shadow-brand-primary/30',
    iconClass: 'border-brand-primary text-brand-primary bg-transparent group-hover:bg-brand-dark group-hover:border-brand-primary group-hover:text-brand-primary',
    Icon: ArrowRightLeft
  },
  danger: {
    baseClass: 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger hover:bg-brand-danger hover:border-brand-danger hover:text-white hover:shadow-brand-danger/30',
    iconClass: 'border-brand-danger text-brand-danger bg-transparent group-hover:bg-brand-dark group-hover:border-brand-danger group-hover:text-brand-danger',
    Icon: ArrowDown
  },
  info: {
    baseClass: 'bg-brand-info/10 border-brand-info/20 text-brand-info hover:bg-brand-info hover:border-brand-info hover:text-brand-dark hover:shadow-brand-info/30',
    iconClass: 'border-brand-info text-brand-info bg-transparent group-hover:bg-brand-dark group-hover:border-brand-info group-hover:text-brand-info',
    Icon: ArrowRightLeft
  }
};

function DashboardAction({ variant = 'primary', label, onClick, className = '' }) {
  const style = variants[variant] || variants.primary;
  const Icon = style.Icon;

  return (
    <button 
      onClick={onClick}
      className={`w-full border rounded-2xl p-5 flex items-center justify-between transition-all duration-300 group shadow-lg hover:-translate-y-1 min-h-20 cursor-pointer ${style.baseClass} ${className}`}
    >
      <span className="text-base font-extrabold uppercase tracking-wider transition-colors duration-300">{label}</span>
      <div className={`p-2 rounded-full border transition-all duration-300 group-hover:scale-110 ${style.iconClass}`}>
        <Icon size={24} />
      </div>
    </button>
  );
}

export default DashboardAction;
