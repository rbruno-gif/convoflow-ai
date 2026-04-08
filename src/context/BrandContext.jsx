import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [activeBrandId, setActiveBrandId] = useState(() => localStorage.getItem('activeBrandId') || null);

  const { data: allBrands = [], isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Brand.filter({ is_archived: false }, '-created_date', 100);
        console.log('BrandContext: Loaded brands:', result);
        return result;
      } catch (err) {
        console.error('BrandContext: Failed to fetch brands:', err);
        return [];
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // All brands are accessible (SDK will enforce permissions)
  const accessibleBrands = allBrands;

  // Auto-select: prefer stored brand, fallback to first
  useEffect(() => {
    if (accessibleBrands.length > 0 && !activeBrandId) {
      const brandToUse = accessibleBrands[0].id;
      setActiveBrandId(brandToUse);
      localStorage.setItem('activeBrandId', brandToUse);
    } else if (activeBrandId && accessibleBrands.length > 0) {
      const stillExists = accessibleBrands.find(b => b.id === activeBrandId);
      if (!stillExists) {
        const brandToUse = accessibleBrands[0].id;
        setActiveBrandId(brandToUse);
        localStorage.setItem('activeBrandId', brandToUse);
      }
    }
  }, [accessibleBrands]);

  const switchBrand = (brandId) => {
    setActiveBrandId(brandId);
    localStorage.setItem('activeBrandId', brandId);
  };

  const activeBrand = accessibleBrands.find(b => b.id === activeBrandId) || null;

  return (
    <BrandContext.Provider value={{
      activeBrand,
      activeBrandId,
      brands: accessibleBrands,
      switchBrand,
      isLoading,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}