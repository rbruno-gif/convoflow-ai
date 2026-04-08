import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';

export default function BrandSwitcher() {
  const { activeBrand, brands, switchBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    // Use a small delay to avoid the click that opened the menu from closing it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!activeBrand || brands.length === 0) return null;

  return (
    <div ref={ref} className="relative px-3 pb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/10 group"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <BrandAvatar brand={activeBrand} size={28} />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate">{activeBrand.name}</p>
          <p className="text-[10px] text-gray-400 truncate">
            {activeBrand.slug === 'u2c-group' ? '⚡ Super Admin' : activeBrand.slug}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: activeBrand.is_active ? '#22c55e' : '#6b7280' }}
          />
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown with animation */}
      <div
        className="absolute left-3 right-3 top-full mt-1 rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
        style={{
          background: '#1a1f2e',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        <div className="max-h-60 overflow-y-auto pb-2">
          {/* U2C Group first */}
          {brands.filter(b => b.slug === 'u2c-group').map(brand => (
            <BrandOption key={brand.id} brand={brand} active={activeBrand.id === brand.id} onSelect={() => { switchBrand(brand.id); setOpen(false); }} isGroup />
          ))}
          {brands.some(b => b.slug === 'u2c-group') && brands.some(b => b.slug !== 'u2c-group') && (
            <div className="mx-3 my-1 border-t border-white/10" />
          )}
          {brands.filter(b => b.slug !== 'u2c-group').map(brand => (
            <BrandOption key={brand.id} brand={brand} active={activeBrand.id === brand.id} onSelect={() => { switchBrand(brand.id); setOpen(false); }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandOption({ brand, active, onSelect, isGroup }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
    >
      <BrandAvatar brand={brand} size={24} />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium text-white truncate">{brand.name}</p>
        <p className="text-[10px] text-gray-500 truncate">
          {isGroup ? '⚡ Super Admin' : brand.slug}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full"
          style={{ background: brand.is_active ? '#22c55e' : '#6b7280' }} />
        {active && <Check className="w-3.5 h-3.5 text-violet-400" />}
      </div>
    </button>
  );
}

export function BrandAvatar({ brand, size = 28 }) {
  if (brand?.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={brand.name}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = brand?.primary_color || '#7c3aed';
  const initials = brand?.name?.slice(0, 2)?.toUpperCase() || '??';
  return (
    <div
      className="rounded-lg flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}