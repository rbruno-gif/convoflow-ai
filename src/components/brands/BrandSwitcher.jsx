import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';

export default function BrandSwitcher() {
  const { activeBrand, activeBrands, switchBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeBrand || activeBrands.length === 0) return null;

  return (
    <div ref={ref} className="relative px-3 pb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/10 group"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <BrandAvatar brand={activeBrand} size={28} />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate">{activeBrand.name}</p>
          <p className="text-[10px] text-gray-400 truncate">{activeBrand.slug}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
          style={{ background: '#1a1f2e' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 pt-3 pb-1">Switch Brand</p>
          {activeBrands.map(brand => (
            <button
              key={brand.id}
              onClick={() => { switchBrand(brand.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 transition-colors"
            >
              <BrandAvatar brand={brand} size={24} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white truncate">{brand.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{brand.slug}</p>
              </div>
              {activeBrand.id === brand.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
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