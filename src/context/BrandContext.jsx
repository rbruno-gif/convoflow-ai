import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [activeBrandId, setActiveBrandId] = useState(() => localStorage.getItem('activeBrandId') || null);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (err) {
        console.warn('Failed to load user:', err);
      }
    };
    loadUser();
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
    // Others see only brands they're assigned to (or where can_see_all_brands is true)
    return allBrands.filter(b =>
      b.assigned_agents?.includes(user.email) || b.can_see_all_brands
    );
  })();

  // Auto-select: prefer stored brand, fallback to first accessible
  useEffect(() => {
    if (!user) return;

    if (!activeBrandId && accessibleBrands.length > 0) {
      const first = accessibleBrands[0];
      setActiveBrandId(first.id);
      localStorage.setItem('activeBrandId', first.id);
    } else if (activeBrandId && accessibleBrands.length > 0) {
      const stillAccessible = accessibleBrands.find(b => b.id === activeBrandId);
      if (!stillAccessible) {
        const first = accessibleBrands[0];
        setActiveBrandId(first.id);
        localStorage.setItem('activeBrandId', first.id);
      }
    }

    setIsInitialized(true);
  }, [accessibleBrands, activeBrandId, user]);

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
      isInitialized,
      switchBrand,
      user,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return context;
}