import React from 'react';
import { useTenant } from '@/lib/TenantContext';

/**
 * Wrapper component that ensures a route requires:
 * 1. Active tenant/company
 * 2. User has required role
 */
export function TenantRoute({ children, requiredRole = null }) {
  const { currentCompany, userRole, loading, isCompanyAdmin, isSuperAdmin } = useTenant();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-3">
        <h1 className="text-xl font-bold">No Company Selected</h1>
        <p className="text-muted-foreground">Please select a company to continue</p>
      </div>
    );
  }

  // Role-based access control
  if (requiredRole === 'admin' && !isCompanyAdmin() && !isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-3">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this page</p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withTenant(Component, requiredRole = null) {
  return (props) => (
    <TenantRoute requiredRole={requiredRole}>
      <Component {...props} />
    </TenantRoute>
  );
}