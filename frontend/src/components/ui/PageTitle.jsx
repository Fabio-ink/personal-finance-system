import React from 'react';

function PageTitle({ children, className = '', level = 1 }) {
  const Tag = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h1';
  return (
    <Tag className={`font-bold text-white flex items-center gap-3 ${className}`}>
      {children}
    </Tag>
  );
}

export default PageTitle;

