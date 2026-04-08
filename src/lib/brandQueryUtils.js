/**
 * Utility functions for brand-aware database queries
 * Ensures all queries filter by activeBrand.id
 */

/**
 * Create a query key for brand-scoped data
 * @param {string} prefix - Query key prefix (e.g., 'conversations', 'tickets')
 * @param {string} brandId - Active brand ID
 * @returns {array} Query key for React Query
 */
export const makeBrandQueryKey = (prefix, brandId) => {
  return [prefix, brandId];
};

/**
 * Safely query with error handling
 * @param {function} queryFn - The actual query function
 * @returns {function} Wrapped function with error handling
 */
export const withErrorHandling = (queryFn) => {
  return async (...args) => {
    try {
      return await queryFn(...args);
    } catch (error) {
      console.error('Query error:', error);
      throw error; // Let React Query handle it
    }
  };
};

/**
 * Create a safe filter object for brand queries
 * @param {string} brandId - Active brand ID
 * @param {object} otherFilters - Additional filters
 * @returns {object} Combined filter
 */
export const makeBrandFilter = (brandId, otherFilters = {}) => {
  if (!brandId) {
    console.warn('makeBrandFilter called without brandId');
    return otherFilters;
  }
  return {
    brand_id: brandId,
    ...otherFilters,
  };
};