import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [activeBrand, setActiveBrand] = useState(() => {
    try {
      const stored = localStorage.getItem('u2c_active_brand');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
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
    if (user.role === 'admin') return allBrands;
    return allBrands.filter(b =>
      b.assigned_agents?.includes(user.email) || b.can_see_all_brands
    );
  })();

  // Auto-select: prefer stored brand, fallback to first accessible
  useEffect(() => {
    if (!user || accessibleBrands.length === 0) return;

    let selectedBrand = null;

    // Try to use stored brand if still accessible
    if (activeBrand && activeBrand.id) {
      const stillAccessible = accessibleBrands.find(b => b.id === activeBrand.id);
      if (stillAccessible) {
        selectedBrand = stillAccessible;
      }
    }

    // Fallback to first accessible brand
    if (!selectedBrand) {
      selectedBrand = accessibleBrands[0];
    }

    if (selectedBrand && (!activeBrand || activeBrand.id !== selectedBrand.id)) {
      const brandData = {
        id: selectedBrand.id,
        name: selectedBrand.name,
        slug: selectedBrand.slug,
        primary_color: selectedBrand.primary_color,
      };
      setActiveBrand(brandData);
      localStorage.setItem('u2c_active_brand', JSON.stringify(brandData));
    }

    setIsInitialized(true);
  }, [accessibleBrands, user]);

  const switchBrand = (brandId) => {
    const brand = accessibleBrands.find(b => b.id === brandId);
    if (brand) {
      const brandData = {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        primary_color: brand.primary_color,
      };
      setActiveBrand(brandData);
      localStorage.setItem('u2c_active_brand', JSON.stringify(brandData));
    }
  };

  return (
    <BrandContext.Provider value={{
      activeBrand,
      activeBrandId: activeBrand?.id,
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