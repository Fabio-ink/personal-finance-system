import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAccountColor } from '../utils/accountUtils';

function AccountBalanceCarousel({ accounts = [], formatCurrency }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const mainAccount = accounts.find(acc => acc.isMain);
  const secondaryAccounts = accounts.filter(acc => !acc.isMain);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        observer.disconnect();
      };
    }
  }, [secondaryAccounts.length]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 150;
    const targetScroll = el.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    try {
      el.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    } catch {
      el.scrollLeft = targetScroll;
    }
    
    // Immediate fallback check & manual scroll if smooth scrollTo fails to reach target
    setTimeout(() => {
      if (el) {
        if (Math.abs(el.scrollLeft - targetScroll) > 5) {
          el.scrollLeft = targetScroll;
        }
        checkScroll();
      }
    }, 250);
  };

  if (accounts.length === 0) {
    return null;
  }

  const displayAccount = mainAccount || accounts[0];

  return (
    <div className="w-full overflow-hidden">
      <p className="text-xs text-gray-400 mb-0.5">
        {displayAccount.name}
      </p>
      <h3 className="text-4xl font-light text-white">
        {formatCurrency(displayAccount.currentBalance ?? displayAccount.initialBalance ?? 0)}
      </h3>

      {secondaryAccounts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border/20 flex items-center gap-2 w-full overflow-hidden">
          <button
            onClick={() => scroll('left')}
            className={`shrink-0 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-10 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={scrollRef}
            className="flex-1 min-w-0 flex gap-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {secondaryAccounts.map(acc => (
              <div
                key={acc.id}
                className="shrink-0 border-l-2 pl-3 flex flex-col justify-center"
                style={{ borderColor: getAccountColor(acc.name) }}
              >
                <p className="text-sm font-normal text-gray-300 font-mono whitespace-nowrap">
                  {formatCurrency(acc.currentBalance ?? acc.initialBalance ?? 0)}
                </p>
                <p className="text-[10px] tracking-wider text-gray-500 mb-0.5 whitespace-nowrap">
                  {acc.name}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className={`shrink-0 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-10 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountBalanceCarousel;
