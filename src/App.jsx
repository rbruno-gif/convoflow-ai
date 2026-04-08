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
import GroupDashboard from '@/pages/GroupDashboard';
import DepartmentManagement from '@/pages/DepartmentManagement';
import CustomerProfilesPage from '@/pages/CustomerProfilesPage';
import AuditLogPage from '@/pages/AuditLogPage';
import AgentManagement from '@/pages/AgentManagement';
import Conversations from '@/pages/Conversations';
import Inbox from '@/pages/Inbox';
import QueueDashboard from '@/pages/QueueDashboard';
import SLADashboard from '@/pages/SLADashboard';
import CannedResponses from '@/pages/CannedResponses';
import BusinessHoursSettings from '@/pages/BusinessHoursSettings';
import KnowledgeBase from '@/pages/KnowledgeBase';
import KnowledgeScraper from '@/pages/KnowledgeScraper';
import WidgetBuilder from '@/pages/WidgetBuilder';
import AIAgent from '@/pages/AIAgent';
import Workflows from '@/pages/Workflows';
import Analytics from '@/pages/Analytics';
import BrandInbox from '@/pages/BrandInbox';
import BrandAnalytics from '@/pages/BrandAnalytics';
import ReportingDashboard from '@/pages/ReportingDashboard';
import TeamChat from '@/pages/TeamChat';
import Departments from '@/pages/Departments';
import BusinessHoursPage from '@/pages/BusinessHoursPage';
import AutoReplies from '@/pages/AutoReplies';
import AgentCapacityPage from '@/pages/AgentCapacityPage';
import CustomerProfiles from '@/pages/CustomerProfiles';
import SLARules from '@/pages/SLARules';
import QueueManagement from '@/pages/QueueManagement';
import Visitors from '@/pages/Visitors';
import Flows from '@/pages/Flows';
import Tickets from '@/pages/Tickets';
import Leads from '@/pages/Leads';
import Flagged from '@/pages/Flagged';
import Agents from '@/pages/Agents';
import Integrations from '@/pages/Integrations';
import Settings from '@/pages/Settings';
import CommitLogs from '@/pages/CommitLogs';
import LiveSupport from '@/pages/LiveSupport';
import Voice from '@/pages/Voice';
import Campaigns from '@/pages/Campaigns';
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
        <Route path="/group" element={<GroupDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/departments" element={<DepartmentManagement />} />
        <Route path="/agents" element={<AgentManagement />} />
        <Route path="/customers" element={<CustomerProfilesPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/queue" element={<QueueDashboard />} />
        <Route path="/sla" element={<SLADashboard />} />
        <Route path="/canned-responses" element={<CannedResponses />} />
        <Route path="/business-hours" element={<BusinessHoursSettings />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/knowledge-scraper" element={<KnowledgeScraper />} />
        <Route path="/widget-builder" element={<WidgetBuilder />} />
        <Route path="/ai-agent" element={<AIAgent />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/brand-analytics" element={<BrandAnalytics />} />
        <Route path="/reporting" element={<ReportingDashboard />} />
        <Route path="/team-chat" element={<TeamChat />} />
        <Route path="/auto-replies" element={<AutoReplies />} />
        <Route path="/agent-capacity" element={<AgentCapacityPage />} />
        <Route path="/customer-profiles" element={<CustomerProfiles />} />
        <Route path="/sla-rules" element={<SLARules />} />
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/flows" element={<Flows />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/flagged" element={<Flagged />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/commit-logs" element={<CommitLogs />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/live-support" element={<LiveSupport />} />
        <Route path="/voice" element={<Voice />} />
        <Route path="/campaigns" element={<Campaigns />} />
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