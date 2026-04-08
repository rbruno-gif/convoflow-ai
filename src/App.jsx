import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { BrandProvider } from '@/context/BrandContext';
import Brands from '@/pages/Brands';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';

// Pages
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Conversations from '@/pages/Conversations';
import Analytics from '@/pages/Analytics';
import AIAgent from '@/pages/AIAgent';
import Visitors from '@/pages/Visitors';
import Flows from '@/pages/Flows';
import Tickets from '@/pages/Tickets';
import Leads from '@/pages/Leads';
import Flagged from '@/pages/Flagged';
import Agents from '@/pages/Agents';
import Integrations from '@/pages/Integrations';
import Settings from '@/pages/Settings';
import CommitLogs from '@/pages/CommitLogs';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import DataDeletion from '@/pages/DataDeletion';
import DemoWalkthrough from '@/pages/DemoWalkthrough';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0f1117' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Loading ConvoFlow...</p>
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<DemoWalkthrough />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/data-deletion" element={<DataDeletion />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai-agent" element={<AIAgent />} />
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/flows" element={<Flows />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/flagged" element={<Flagged />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/commit-logs" element={<CommitLogs />} />
        <Route path="/brands" element={<Brands />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BrandProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
        </BrandProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App