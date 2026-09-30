import type { CSSProperties, ReactNode } from 'react';
import type { LeadStatus, Partner, PartnerId } from '../types';
import { PARTNER_MAP, STATUS_MAP, STATUSES, nextActionLabel } from '../lib/constants';

/* ------------------------------------------------------------------- icons */
const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  leads: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  newLeads: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" />
    </>
  ),
  followups: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
  pipeline: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M9 4v16M15 4v16" />
    </>
  ),
  activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  ),
  message: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20.5l1.6-4.6A8.5 8.5 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" />,
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2.5 6.8 9.5 6.7 9.5-6.7" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
    </>
  ),
  meeting: (
    <>
      <rect x="2" y="6" width="13" height="10" rx="2" />
      <path d="m15 10 5-3v8l-5-3z" />
      <path d="M6 3v3M10 3v3" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m20 6-11 11-5-5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.3 12 2.6 2.6 4.8-5.2" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5M12 17.2h.01" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
      <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8.2V20l-4-2v-4.8z" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16 5-5-5-5M21 11H9" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  userCheck: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16.5 11 2.2 2.2 4-4.2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.4A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  flag: <path d="M5 22V4h11l-1.6 4L18 12H5" />,
  alarm: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.2 2M4.5 3 2 6M19.5 3 22 6" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7.5h.01M15 7.5h.01M9 11.5h.01M15 11.5h.01M10.5 21v-5h3v5" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  complete: <path d="m5 4 10 8-10 8zM19 5v14" />,
  file: (
    <>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5M9 13h6M9 17h4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 16,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, borderRadius: size / 4 }}>
      <svg width={Math.round(size * 0.62)} height={Math.round(size * 0.62)} viewBox="0 0 24 24" fill="none">
        <path
          d="M7 4v9a5 5 0 0 0 5 5h5"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="17" cy="18" r="2.6" fill="#fff" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ atoms */
export function Avatar({
  partnerId,
  size = 'md',
  dark = false,
}: {
  partnerId: PartnerId | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}) {
  const partner: Partner | undefined = partnerId ? PARTNER_MAP[partnerId] : undefined;
  const cls = ['avatar', size !== 'md' ? `avatar--${size}` : '', dark ? 'avatar--dark' : '']
    .filter(Boolean)
    .join(' ');
  if (!partner) {
    return (
      <span className={cls} style={{ background: 'var(--line-strong)' }} title="Unassigned">
        ?
      </span>
    );
  }
  return (
    <span
      className={cls}
      style={{ background: `hsl(${partner.hue} 55% 40%)` }}
      title={partner.name}
      aria-label={partner.name}
    >
      {partner.initials}
    </span>
  );
}

export function StatusChip({ status, size }: { status: LeadStatus; size?: 'sm' }) {
  const meta = STATUS_MAP[status];
  return (
    <span
      className="chip"
      style={{ background: meta.chipBg, color: meta.chipText, height: size === 'sm' ? 20 : 22 }}
    >
      <span className="chip__dot" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

/**
 * Status as a dropdown, tinted with the status colour. Tapping the pill in a list
 * changes the status without opening the lead — the most common edit in the app.
 * The dot and the chevron are drawn by CSS so the control stays a real <select>.
 */
export function StatusSelect({
  value,
  onChange,
  label = 'Change status',
}: {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  label?: string;
}) {
  const meta = STATUS_MAP[value];
  return (
    <span
      className="status-picker"
      style={{ '--dot': meta.dot, '--ring': meta.dot } as CSSProperties}
    >
      <select
        className="status-select"
        value={value}
        aria-label={label}
        style={{ background: meta.chipBg, color: meta.chipText }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value as LeadStatus);
        }}
      >
        {STATUSES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** The standing reminder that a lead without a next action gets dropped. */
export function NextAction({ value, compact }: { value: string | null; compact?: boolean }) {
  if (!value) {
    return (
      <span className="missing">
        <Icon name="alert" size={compact ? 12 : 13} />
        No next action set
      </span>
    );
  }
  if (value === 'none') {
    return <span className="faint">{compact ? 'No further action' : 'No further action needed'}</span>;
  }
  return <span className="cell-strong">{nextActionLabel(value)}</span>;
}

export function EmptyState({
  icon = 'file',
  title,
  hint,
  action,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={19} />
      </span>
      <strong>{title}</strong>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

export function SectionHead({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="section__head">
      <h2>{title}</h2>
      {count !== undefined && <span className="section__count tnum">{count}</span>}
      {action && <span className="section__link">{action}</span>}
    </div>
  );
}
