import React, { createContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize tenant context on app load
  useEffect(() => {
    const initTenant = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Get all companies this user has access to
        const userCompanies = await base44.entities.CompanyAgent.filter({
          email: currentUser.email,
          status: 'active',
        });

        if (userCompanies.length > 0) {
          // Fetch full company data
          const companyIds = userCompanies.map((ca) => ca.company_id);
          const companiesData = await Promise.all(
            companyIds.map((id) => base44.entities.Company.filter({ id }))
          );
          const allCompanies = companiesData.flat();
          setCompanies(allCompanies);

          // Set first company as default
          if (allCompanies.length > 0) {
            setCurrentCompany(allCompanies[0]);
            const role = userCompanies.find((ca) => ca.company_id === allCompanies[0].id)?.role;
            setUserRole(role || 'agent');
          }
        }
      } catch (error) {
        console.error('Failed to initialize tenant context:', error);
      } finally {
        setLoading(false);
      }
    };

    initTenant();
  }, []);

  const switchCompany = useCallback((company) => {
    setCurrentCompany(company);
    const userRole = companies.find((c) => c.id === company.id)?.role;
    setUserRole(userRole);
  }, [companies]);

  const isSuperAdmin = () => user?.role === 'admin';
  const isCompanyAdmin = () => userRole === 'admin';
  const isAgent = () => userRole === 'agent';

  return (
    <TenantContext.Provider
      value={{
        currentCompany,
        userRole,
        companies,
        user,
        loading,
        switchCompany,
        isSuperAdmin,
        isCompanyAdmin,
        isAgent,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}