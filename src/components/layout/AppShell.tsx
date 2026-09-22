import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FlaskConical, Menu, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/useAppState';
import { Badge } from '@/components/ui/Badge';
import { LogoMark, Wordmark } from './Logo';
import { MOBILE_NAV, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from './navigation';

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-colors duration-150',
          isActive
            ? 'bg-white/[0.06] font-medium text-ink'
            : 'text-ink-muted hover:bg-white/[0.035] hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={16}
            className={cn('shrink-0', isActive ? 'text-accent' : 'text-ink-faint')}
          />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, xp, analytics } = useAppState();

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-5 pt-5">
        <Wordmark />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
        {PRIMARY_NAV.map((item) => (
          <NavRow key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <div className="px-3 pb-2 pt-5">
          <span className="label-caps">Account</span>
        </div>
        {SECONDARY_NAV.map((item) => (
          <NavRow key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-hairline p-3">
        <div className="rounded-xl border border-hairline bg-raised p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-ink">
                {user?.name ?? 'Developer'}
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-faint">
                {xp.toLocaleString()} XP
                {user?.streakDays ? ` · ${user.streakDays}-day streak` : ''}
              </div>
            </div>
            {user?.isDemo ? (
              <Badge tone="accent" icon={<FlaskConical size={11} />}>
                Demo
              </Badge>
            ) : null}
          </div>
          {analytics ? (
            <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-2.5 text-[11.5px] text-ink-faint">
              <Sparkles size={12} className="text-ink-faint" />
              <span className="truncate">{analytics.sourceLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10.5px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-ink-faint',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-lg transition-colors',
                      isActive && 'bg-accent-soft',
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  {item.shortLabel}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close the drawer and return to the top of the page on navigation.
  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-[#0b0c11]"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-hairline bg-surface md:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 w-[272px] border-r border-hairline bg-surface animate-scale-in"
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-muted hover:bg-white/[0.06] hover:text-ink"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-surface/90 px-4 backdrop-blur-xl md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="-ml-1.5 rounded-lg p-1.5 text-ink-muted hover:bg-white/[0.06] hover:text-ink"
        >
          <Menu size={19} />
        </button>
        <LogoMark size={24} />
        <div className="w-8" />
      </header>

      <div className="md:pl-[248px]">
        <main
          id="main"
          className="mx-auto max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 md:pb-14 md:pt-8 lg:px-8"
        >
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
