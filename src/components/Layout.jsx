import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, MessageSquare, BarChart3, Bot, Eye, Zap,
  Ticket, Users, AlertTriangle, UserCheck, Plug, Settings,
  ChevronLeft, ChevronRight, GitCommit, LogOut, Building2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import BrandSwitcher from '@/components/brands/BrandSwitcher';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/conversations', icon: MessageSquare, label: 'Inbox' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ai-agent', icon: Bot, label: 'AI Agent' },
  { path: '/visitors', icon: Eye, label: 'Visitors' },
  { path: '/flows', icon: Zap, label: 'Flows' },
  { path: '/tickets', icon: Ticket, label: 'Tickets' },
  { path: '/leads', icon: Users, label: 'Leads' },
  { path: '/flagged', icon: AlertTriangle, label: 'Flagged' },
  { path: '/agents', icon: UserCheck, label: 'Agents' },
  { path: '/integrations', icon: Plug, label: 'Integrations' },
  { path: '/brands', icon: Building2, label: 'Brands' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn('flex flex-col shrink-0 transition-all duration-200', collapsed ? 'w-16' : 'w-56')}
        style={{ background: '#0f1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-2.5 px-4 py-4 border-b', collapsed && 'justify-center px-0')}
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-none">ConvoFlow</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>U2C Mobile</p>
            </div>
          )}
        </div>

        {/* Brand Switcher */}
        {!collapsed && (
          <div className="pt-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <BrandSwitcher />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'text-white'
                    : 'hover:text-white'
                )}
                style={active
                  ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))', color: '#a78bfa' }
                  : { color: 'rgba(255,255,255,0.5)' }
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/commit-logs"
            className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all mt-2', collapsed && 'justify-center px-0')}
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <GitCommit className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Commit Logs</span>}
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all', collapsed && 'justify-center px-0')}
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all', collapsed && 'justify-center px-0')}
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}