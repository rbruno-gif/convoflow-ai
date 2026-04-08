import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [activeBrandId, setActiveBrandId] = useState(() => localStorage.getItem('activeBrandId') || null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.filter({ is_archived: false }, '-created_date', 100),
    enabled: !!user,
  });

  // Role-based brand visibility
  const accessibleBrands = (() => {
    if (!user) return [];
    // Admin sees all brands
    if (user.role === 'admin') return allBrands;
    // Others see only brands they're assigned to
    return allBrands.filter(b =>
      b.assigned_agents?.includes(user.email)
    );
  })();

  const activeBrands = accessibleBrands.filter(b => b.is_active);

  // Auto-select: prefer stored brand, fallback to first accessible
  useEffect(() => {
    if (accessibleBrands.length > 0) {
      let brandToUse = activeBrandId;
      
      if (!brandToUse) {
        brandToUse = accessibleBrands[0].id;
      } else {
        const stillAccessible = accessibleBrands.find(b => b.id === brandToUse);
        if (!stillAccessible) {
          brandToUse = accessibleBrands[0].id;
        }
      }
      
      setActiveBrandId(brandToUse);
      localStorage.setItem('activeBrandId', brandToUse);
    }
  }, [accessibleBrands]);

  const switchBrand = (brandId) => {
    setActiveBrandId(brandId);
    localStorage.setItem('activeBrandId', brandId);
  };

  const activeBrand = accessibleBrands.find(b => b.id === activeBrandId) || accessibleBrands[0] || null;

  return (
    <BrandContext.Provider value={{
      activeBrand,
      activeBrandId,
      brands: accessibleBrands,
      allBrands,
      activeBrands,
      switchBrand,
      user,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}