import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, BarChart3, HelpCircle, ShoppingBag, Settings, Bot, AlertTriangle, Ticket, Users, Zap, BookOpen, Palette, LayoutDashboard, Plug, Headphones, UserCog, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
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
      <aside className="w-[220px] bg-[#0f1117] flex flex-col shrink-0 border-r border-white/5">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-sm">ConvoFlow</span>
            <span className="block text-[10px] text-white/30 leading-none mt-0.5">AI Agent</span>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-4" />

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, path }) => {
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-violet-400" : "")} />
                      {label}
                      {active && <ChevronRight className="w-3 h-3 ml-auto text-white/20" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white/70 truncate">Admin</p>
              <p className="text-[9px] text-white/25 truncate">© 2026 ConvoFlow</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
