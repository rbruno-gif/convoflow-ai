import { useTenant } from '@/lib/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Custom hook to fetch company-specific data with automatic tenant filtering
 */
export function useTenantData(entity, filters = {}, options = {}) {
  const { currentCompany } = useTenant();

  const { queryKey = [entity], ...queryOptions } = options;

  return useQuery({
    queryKey: [entity, currentCompany?.id, filters],
    queryFn: async () => {
      if (!currentCompany) return [];
      const mergedFilters = {
        company_id: currentCompany.id,
        ...filters,
      };
      return base44.entities[entity].filter(mergedFilters);
    },
    enabled: !!currentCompany,
    ...queryOptions,
  });
}

/**
 * Hook for creating company-specific records
 */
export function useTenantCreate(entity) {
  const { currentCompany } = useTenant();

  return async (data) => {
    if (!currentCompany) throw new Error('No company selected');
    return base44.entities[entity].create({
      company_id: currentCompany.id,
      ...data,
    });
  };
}

/**
 * Hook for updating company-specific records
 */
export function useTenantUpdate(entity) {
  const { currentCompany } = useTenant();

  return async (id, data) => {
    if (!currentCompany) throw new Error('No company selected');
    return base44.entities[entity].update(id, data);
  };
}

/**
 * Hook for deleting company-specific records
 */
export function useTenantDelete(entity) {
  const { currentCompany } = useTenant();

  return async (id) => {
    if (!currentCompany) throw new Error('No company selected');
    return base44.entities[entity].delete(id);
  };
}