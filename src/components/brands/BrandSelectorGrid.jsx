import { useBrand } from '@/context/BrandContext';
import { CheckCircle2 } from 'lucide-react';

export default function BrandSelectorGrid() {
  const { activeBrand, brands, switchBrand, user } = useBrand();

  // Only show for admins
  if (user?.role !== 'admin' || brands.length <= 1) return null;

  return (
    <div className="mb-8 p-6 rounded-xl border border-border bg-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Switch Brand</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {brands.map(brand => (
          <button
            key={brand.id}
            onClick={() => switchBrand(brand.id)}
            className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md"
            style={{
              borderColor: activeBrand?.id === brand.id ? brand.primary_color : 'hsl(var(--border))',
              background: activeBrand?.id === brand.id ? `${brand.primary_color}10` : 'hsl(var(--card))',
            }}
          >
            {/* Logo/Avatar */}
            <div className="flex items-center justify-center h-12 mb-2">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-full object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: brand.primary_color }}
                >
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Brand Name */}
            <p className="text-xs font-semibold text-foreground truncate text-center">{brand.name}</p>

            {/* Active Indicator */}
            {activeBrand?.id === brand.id && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: brand.primary_color }} />
              </div>
            )}

            {/* Status Dot */}
            <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: brand.is_active ? '#22c55e' : '#6b7280' }}
              />
              {brand.is_active ? 'Active' : 'Inactive'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}