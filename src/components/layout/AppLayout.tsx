import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layers, LayoutDashboard, Inbox, Zap, Flag, Users, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { path: '/boards', label: 'Boards', icon: LayoutDashboard },
  { path: '/backlog', label: 'Backlog', icon: Inbox },
  { path: '/sprints', label: 'Sprints', icon: Zap },
  { path: '/epics', label: 'Epics', icon: Flag },
  { path: '/team', label: 'Team', icon: Users },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-16 flex-col items-center border-r bg-card py-4 gap-1">
        <button onClick={() => navigate('/boards')} className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Layers className="h-5 w-5 text-primary-foreground" />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
