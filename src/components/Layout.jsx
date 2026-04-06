import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, BarChart3, HelpCircle, ShoppingBag, Settings, Bot, AlertTriangle, Ticket, Users, Zap, BookOpen, Palette, LayoutDashboard, Plug, Headphones, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { icon: MessageSquare, label: 'Conversations', path: '/conversations' },
      { icon: Headphones, label: 'Agent Inbox', path: '/agent-inbox' },
      { icon: AlertTriangle, label: 'Flagged', path: '/flagged' },
      { icon: Ticket, label: 'Help Desk', path: '/tickets' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { icon: Users, label: 'Leads', path: '/leads' },
      { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    ],
  },
  {
  label: 'AI & Automation',
  items: [
    { icon: Zap, label: 'Flows', path: '/flows' },
    { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge' },
    { icon: HelpCircle, label: 'FAQ Manager', path: '/faqs' },
    { icon: MessageSquare, label: 'Quick Replies', path: '/quick-replies' },
  ],
  },
  {
  label: 'Settings',
  items: [
    { icon: UserCog, label: 'Agents', path: '/agents' },
    { icon: Palette, label: 'Widget', path: '/widget' },
    { icon: Settings, label: 'App Settings', path: '/app-settings' },
    { icon: Settings, label: 'AI Settings', path: '/settings' },
    { icon: Bot, label: 'AI Tester', path: '/ai-test' },
    { icon: Plug, label: 'Integrations', path: '/integrations' },
  ],
  },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar flex flex-col shrink-0">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground tracking-tight">ShopBot</span>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, path }) => {
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40">© 2026 ShopBot</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}