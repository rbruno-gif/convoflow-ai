import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, BarChart3, HelpCircle, ShoppingBag, Settings, Bot, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Conversations', path: '/conversations' },
  { icon: AlertTriangle, label: 'Flagged', path: '/flagged' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: HelpCircle, label: 'FAQ Manager', path: '/faqs' },
  { icon: Settings, label: 'AI Settings', path: '/settings' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground tracking-tight">ShopBot</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
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
        </nav>

        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">© 2026 ShopBot</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}