import { useState } from 'react';
import { useCrm } from '../state/store';
import { useDismiss } from './Toast';
import { Avatar, Icon } from './ui';

export function ProfileMenu() {
  const { currentPartner, data, actions } = useCrm();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useDismiss(open || switching, () => {
    setOpen(false);
    setSwitching(false);
  });

  if (!currentPartner) return null;

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="profile-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="menu">
        <Avatar partnerId={currentPartner.id} />
        <span className="profile-btn__name">{currentPartner.name}</span>
        <Icon name="chevronDown" size={15} style={{ color: 'var(--text-3)' }} />
      </button>

      {open && !switching && (
        <div className="menu" role="menu">
          <div className="menu__head row" style={{ gap: 10 }}>
            <Avatar partnerId={currentPartner.id} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{currentPartner.name}</div>
              <div className="faint truncate" style={{ fontSize: 12 }}>
                {currentPartner.role}
              </div>
            </div>
          </div>

          <div className="menu__title">Signed in as</div>
          <div style={{ padding: '2px 10px 6px', fontSize: 12.5, color: 'var(--text-2)' }}>
            Everything you create is recorded under this name.
          </div>

          <button
            className="menu__item"
            onClick={() => {
              setSwitching(true);
              setOpen(false);
            }}
          >
            <Icon name="users" size={16} />
            Switch partner
          </button>

          <button
            className="menu__item menu__item--danger"
            onClick={() => {
              if (window.confirm('Delete all leads and contact history? This cannot be undone.')) {
                actions.clearLeads();
              }
              setOpen(false);
            }}
          >
            <Icon name="file" size={16} />
            Delete all leads
          </button>

          <div className="menu__sep" />

          <button
            className="menu__item menu__item--danger"
            onClick={() => {
              actions.signOut();
              setOpen(false);
            }}
          >
            <Icon name="logout" size={16} />
            Log out
          </button>
        </div>
      )}

      {switching && (
        <div className="menu" role="menu">
          <div className="menu__head">
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Switch partner</div>
            <div className="faint" style={{ fontSize: 12 }}>
              Anything you log from now on is recorded under them.
            </div>
          </div>
          {data.partners.map((p) => (
            <button
              key={p.id}
              className={
                p.id === currentPartner.id ? 'menu__item menu__item--selected' : 'menu__item'
              }
              onClick={() => {
                actions.signIn(p.id);
                setSwitching(false);
              }}
            >
              <Avatar partnerId={p.id} size="sm" />
              {p.name}
              {p.id === currentPartner.id && (
                <Icon name="check" size={15} style={{ marginLeft: 'auto' }} />
              )}
            </button>
          ))}
          <div className="menu__sep" />
          <button className="menu__item" onClick={() => setSwitching(false)}>
            <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} />
            Back
          </button>
        </div>
      )}
    </div>
  );
}
