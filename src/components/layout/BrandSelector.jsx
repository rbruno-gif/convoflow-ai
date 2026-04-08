import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

export default function BrandSelector() {
  const { activeBrand, brands, switchBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {!activeBrand ? (
        <div className="text-xs text-gray-500 px-3 py-2">Loading brand...</div>
      ) : (
        <>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
      >
        <BrandAvatar brand={activeBrand} size={24} />
        <div className="text-left">
          <p className="text-xs font-semibold text-gray-900">{activeBrand.name}</p>
          <p className="text-[10px] text-gray-500">
            {activeBrand.slug === 'u2c-group' ? '⚡ Super Admin' : activeBrand.slug}
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-56">
          <div className="max-h-64 overflow-y-auto py-1">
            {/* U2C Group first */}
            {brands.filter(b => b.slug === 'u2c-group').map(brand => (
              <BrandDropdownItem
                key={brand.id}
                brand={brand}
                active={activeBrand.id === brand.id}
                onSelect={() => {
                  switchBrand(brand.id);
                  setOpen(false);
                }}
                isGroup
              />
            ))}
            {brands.some(b => b.slug === 'u2c-group') && brands.some(b => b.slug !== 'u2c-group') && (
              <div className="my-1 border-t border-gray-100" />
            )}
            {/* Other brands */}
            {brands.filter(b => b.slug !== 'u2c-group').map(brand => (
              <BrandDropdownItem
                key={brand.id}
                brand={brand}
                active={activeBrand.id === brand.id}
                onSelect={() => {
                  switchBrand(brand.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function BrandDropdownItem({ brand, active, onSelect, isGroup }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${
        active ? 'bg-violet-50' : ''
      }`}
    >
      <BrandAvatar brand={brand} size={20} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${active ? 'text-violet-700' : 'text-gray-900'}`}>
          {brand.name}
        </p>
        <p className="text-[10px] text-gray-500 truncate">
          {isGroup ? '⚡ Super Admin' : brand.slug}
        </p>
      </div>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: brand.is_active ? '#22c55e' : '#d1d5db' }} />
      {active && <span className="text-violet-600 text-xs font-semibold ml-1">✓</span>}
    </button>
  );
}