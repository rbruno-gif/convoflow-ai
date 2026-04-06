import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, navigateToLogin } = useAuth();

  if (!user) {
    navigateToLogin();
    return null;
  }

  return children;
}