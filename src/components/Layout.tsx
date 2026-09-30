import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCrm } from '../state/store';
import { dashboardCounts, todayFollowUps } from '../lib/selectors';
import { ProfileMenu } from './ProfileMenu';
import { Avatar, BrandMark, Icon, type IconName } from './ui';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/leads', label: 'Leads', icon: 'leads' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { data, currentPartner } = useCrm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const dueToday = useMemo(
    () => todayFollowUps(data.leads).length,
    [data.leads],
  );
  const newLeads = useMemo(
    () => dashboardCounts(data.leads).newLeads,
    [data.leads],
  );

  const badge = (to: string) => (to === '/' ? dueToday : to === '/leads' ? newLeads : 0);

  return (
    <div className="shell">
      {drawerOpen && <div className="drawer-scrim" onClick={() => setDrawerOpen(false)} />}

      <aside className={drawerOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar__brand">
          <BrandMark />
          <div>
            <div className="sidebar__name">LeadFlow</div>
            <div className="sidebar__tag">Lead Management</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((entry) => {
            const count = badge(entry.to);
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.to === '/'}
                className={({ isActive }) => (isActive ? 'nav__item nav__item--active' : 'nav__item')}
              >
                <Icon name={entry.icon} size={17} />
                {entry.label}
                {count > 0 && <span className="nav__count nav__count--alert">{count}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__foot">
          <Avatar partnerId={currentPartner?.id ?? null} />
          <div className="sidebar__foot-meta">
            <div className="sidebar__foot-name">{currentPartner?.name}</div>
            <div className="sidebar__foot-role">
              {dueToday} follow-up{dueToday === 1 ? '' : 's'} due
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn topbar__hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" size={19} />
          </button>
          <div className="topbar__brand">
            <BrandMark />
            <span>LeadFlow</span>
          </div>
          <div className="row" style={{ gap: 4, marginLeft: 'auto' }}>
            <ProfileMenu />
          </div>
        </header>

        {children}
      </div>

      <nav className="bottomnav">
        {NAV.map((entry) => {
          const count = badge(entry.to);
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === '/'}
              className={({ isActive }) => (isActive ? 'bottomnav__item bottomnav__item--active' : 'bottomnav__item')}
            >
              <Icon name={entry.icon} size={19} />
              {entry.label}
              {count > 0 && <span className="bottomnav__count">{count}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
