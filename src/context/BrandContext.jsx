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

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('-created_date', 100),
  });

  const activeBrands = brands.filter(b => b.is_active);

  // Auto-select first brand if none selected
  useEffect(() => {
    if (!activeBrandId && activeBrands.length > 0) {
      setActiveBrandId(activeBrands[0].id);
    }
  }, [activeBrands, activeBrandId]);

  const switchBrand = (brandId) => {
    setActiveBrandId(brandId);
    localStorage.setItem('activeBrandId', brandId);
  };

  const activeBrand = brands.find(b => b.id === activeBrandId) || brands[0] || null;

  return (
    <BrandContext.Provider value={{ activeBrand, activeBrandId, brands, activeBrands, switchBrand, user }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}