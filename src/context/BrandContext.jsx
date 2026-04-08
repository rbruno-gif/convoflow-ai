import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [activeBrand, setActiveBrand] = useState(() => {
    try {
      const storedId = localStorage.getItem('u2c_active_brand_id');
      if (storedId) return { id: storedId }; // Placeholder, will be filled by useEffect
      return null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initBrand = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        
        // Check localStorage for previously selected brand
        const storedId = localStorage.getItem('u2c_active_brand_id');
        
        // Fetch all available brands for this user
        const allBrands = await base44.entities.Brand.list('-created_date', 100);
        
        // Filter based on user role (admin sees all, others see assigned)
        let accessibleBrands = allBrands;
        if (u?.role !== 'admin') {
          accessibleBrands = allBrands.filter(b => 
            b.assigned_agents?.includes(u?.email) || b.slug === 'u2c-group'
          );
        }
        
        // Try to use stored brand if valid
        let selectedBrand = null;
        if (storedId && accessibleBrands.some(b => b.id === storedId)) {
          selectedBrand = accessibleBrands.find(b => b.id === storedId);
        } else if (accessibleBrands.length > 0) {
          // Default to first accessible brand
          selectedBrand = accessibleBrands[0];
        }
        
        if (selectedBrand) {
          setActiveBrand({
            id: selectedBrand.id,
            name: selectedBrand.name,
            slug: selectedBrand.slug,
            primary_color: selectedBrand.primary_color,
          });
          localStorage.setItem('u2c_active_brand_id', selectedBrand.id);
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize brand:', err);
        setInitError(err.message);
        setIsInitialized(true);
      }
    };
    
    initBrand();
  }, []);

  // Fetch all brands once on mount (used for switcher)
  const { data: allBrands = [] } = useQuery({
    queryKey: ['brands-all'],
    queryFn: () => base44.entities.Brand.filter({ is_archived: false }, '-created_date', 100),
    enabled: !!user,
  });

  // Role-based brand visibility
  const accessibleBrands = (() => {
    if (!user) return [];
    if (user.role === 'admin') return allBrands;
    return allBrands.filter(b =>
      b.assigned_agents?.includes(user.email) || b.slug === 'u2c-group'
    );
  })();

  const switchBrand = (brandId) => {
    const brand = [...accessibleBrands, ...allBrands].find(b => b.id === brandId);
    if (brand) {
      const brandData = {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        primary_color: brand.primary_color,
      };
      setActiveBrand(brandData);
      localStorage.setItem('u2c_active_brand_id', brand.id);
      // Reload page to reset all queries with new brand context
      window.location.reload();
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
      initError,
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