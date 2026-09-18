import React from 'react';

function Card({ children, className = '', as = 'div', ...props }) {
  const Component = as;
  const cardClasses = `bg-brand-card/90 backdrop-blur-md border border-brand-border/60 rounded-2xl shadow-xl transition-all duration-200 ${className}`;

  return (
    <Component className={cardClasses} {...props}>
      {children}
    </Component>
  );
}

export default Card;