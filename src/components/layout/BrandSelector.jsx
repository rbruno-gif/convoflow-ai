import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { BrandAvatar } from '@/components/brands/BrandSwitcher';

export default function BrandSelector() {
  const { activeBrand, brands, switchBrand, isLoading } = useBrand();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading || !activeBrand || brands.length === 0) {
    return <div className="text-xs text-gray-500 px-3 py-2">Loading brands...</div>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
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

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-56">
          <div className="max-h-64 overflow-y-auto py-1">
            {brands.map(brand => (
              <button
                key={brand.id}
                onClick={() => {
                  switchBrand(brand.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${
                  activeBrand.id === brand.id ? 'bg-violet-50' : ''
                }`}
              >
                <BrandAvatar brand={brand} size={20} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${activeBrand.id === brand.id ? 'text-violet-700' : 'text-gray-900'}`}>
                    {brand.name}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {brand.slug === 'u2c-group' ? '⚡ Super Admin' : brand.slug}
                  </p>
                </div>
                {activeBrand.id === brand.id && <span className="text-violet-600 text-xs font-semibold">✓</span>}
              </button>
            ))}
          </div>
        </div>
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