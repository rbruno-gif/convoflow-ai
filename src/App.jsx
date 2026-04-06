import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Conversations from '@/pages/Conversations';
import Flagged from '@/pages/Flagged';
import Orders from '@/pages/Orders';
import FAQs from '@/pages/FAQs';
import AISettings from '@/pages/AISettings';
import Analytics from '@/pages/Analytics';
import Tickets from '@/pages/Tickets';
import Leads from '@/pages/Leads';
import Flows from '@/pages/Flows';
import KnowledgeBase from '@/pages/KnowledgeBase';
import WidgetCustomizer from '@/pages/WidgetCustomizer';
import Integrations from '@/pages/Integrations';
import AgentInbox from '@/pages/AgentInbox';
import Agents from '@/pages/Agents';
import AITest from '@/pages/AITest';
import FAQApprovals from '@/pages/FAQApprovals';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/flagged" element={<Flagged />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/flows" element={<Flows />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/widget" element={<WidgetCustomizer />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/agent-inbox" element={<AgentInbox />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/settings" element={<AISettings />} />
        <Route path="/ai-test" element={<AITest />} />
        <Route path="/faq-approvals" element={<FAQApprovals />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App