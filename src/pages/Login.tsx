import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PartnerId } from '../types';
import { useCrm } from '../state/store';
import { Avatar, BrandMark, Icon } from '../components/ui';

const QUESTIONS: [string, string][] = [
  ['Who?', 'Which partner is handling it'],
  ['When?', 'When they were last contacted'],
  ['How?', 'Call, WhatsApp, email or meeting'],
  ['What?', 'Exactly what the lead said'],
  ['Next?', 'The next action, or a flag that it is missing'],
  ['When next?', 'The follow-up date and time'],
];

export function Login() {
  const { data, actions } = useCrm();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<PartnerId | null>(data.partners[0]?.id ?? null);

  const enter = () => {
    if (!picked) return;
    actions.signIn(picked);
    navigate('/');
  };

  return (
    <div className="login">
      <aside className="login__aside">
        <div className="login__brand">
          <BrandMark size={34} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 640, letterSpacing: '-0.01em' }}>LeadFlow</div>
            <div style={{ fontSize: 12, color: 'var(--on-ink-soft)' }}>Lead Management</div>
          </div>
        </div>

        <div className="login__pitch">
          <h2>Three partners. One shared view of every lead.</h2>
          <p>
            Everyone logs what they did, what came back, and what happens next — so nothing sits
            unanswered and nobody calls the same person twice.
          </p>
          <div className="login__questions">
            {QUESTIONS.map(([q, a]) => (
              <div className="login__question" key={q}>
                <b>{q}</b>
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="login__main">
        <div className="login__form">
          <div className="login__brand" style={{ color: 'var(--text)' }}>
            <BrandMark size={34} />
          </div>

          <h1 className="login__title">Welcome Back</h1>
          <p className="login__sub">Choose who is working today.</p>

          <div className="login__list">
            {data.partners.map((p) => {
              const selected = picked === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  className={selected ? 'login__option login__option--selected' : 'login__option'}
                  onClick={() => setPicked(p.id)}
                >
                  <Avatar partnerId={p.id} size="lg" />
                  <span>
                    <span className="login__option-name">{p.name}</span>
                    <span className="login__option-role" style={{ display: 'block' }}>
                      {p.role}
                    </span>
                  </span>
                  <span className="login__radio" />
                </button>
              );
            })}
          </div>

          <button
            className="btn btn--primary btn--lg btn--block"
            onClick={enter}
            disabled={!picked}
          >
            Continue
            <Icon name="arrowRight" size={17} />
          </button>

          <p className="login__note">
            <Icon name="alert" size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              This is the MVP build with no passwords. Your choice is saved in this browser only and
              you can switch any time from the profile menu.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
