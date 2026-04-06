import { Outlet, useLocation, Link } from 'react-router-dom';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';
import {
  MessageSquare,
  BarChart3,
  Settings,
  Users,
  Zap,
  FileText,
  ShoppingCart,
  AlertCircle,
  Lightbulb,
  Bot,
  Radio,
  HelpCircle,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAVIGATION = [
  {
    label: 'Dashboard',
    href: '/',
    icon: BarChart3,
  },
  {
    label: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
  },
  {
    label: 'Leads',
    href: '/leads',
    icon: Radio,
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: AlertCircle,
  },
  {
    label: 'Knowledge Base',
    href: '/knowledge',
    icon: FileText,
  },
  {
    label: 'FAQs',
    href: '/faqs',
    icon: HelpCircle,
  },
  {
    label: 'Inbox',
    href: '/agent-inbox',
    icon: MessageSquare,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Flows',
    href: '/flows',
    icon: Zap,
  },
  {
    label: 'Widget',
    href: '/widget',
    icon: Bot,
  },
  {
    label: 'AI Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'Team',
    href: '/agents',
    icon: Users,
  },
];

export default function CompanyAdminLayout() {
  const { currentCompany, companies, switchCompany, user } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'bg-sidebar border-r transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo/Company Name */}
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3">
              {currentCompany.logo_url && (
                <img
                  src={currentCompany.logo_url}
                  alt={currentCompany.name}
                  className="w-8 h-8 rounded"
                />
              )}
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {currentCompany.name}
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {NAVIGATION.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                      title={sidebarOpen ? '' : item.label}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Company Switcher & User */}
          <div className="p-2 border-t border-sidebar-border space-y-2">
            {companies.length > 1 && sidebarOpen && (
              <div className="relative">
                <button
                  onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <span className="truncate">Switch Company</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', companyDropdownOpen && 'rotate-180')} />
                </button>
                {companyDropdownOpen && (
                  <div className="absolute bottom-full w-full mb-2 bg-popover border rounded-lg shadow-lg p-1">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          switchCompany(company);
                          setCompanyDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                          currentCompany.id === company.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sidebarOpen && (
              <div className="px-3 py-2 rounded-lg bg-sidebar-accent/30 text-sidebar-foreground text-xs">
                <p className="font-medium truncate">{user?.full_name}</p>
                <p className="text-sidebar-foreground/70 truncate">{user?.email}</p>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center gap-2 text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && 'Logout'}
            </Button>
          </div>

          {/* Sidebar Toggle */}
          {sidebarOpen && (
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="w-full justify-center"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b bg-card flex items-center px-6 gap-3">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            Welcome, {user?.full_name}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  );
}