import { Link, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';

const tabs = [
  { path: '/wallet', label: 'КОШЕЛЁК', icon: WalletIcon },
  { path: '/create-brand', label: 'БРЕНД', icon: PlusIcon },
  { path: '/swap', label: 'ОБМЕН', icon: SwapIcon },
  { path: '/mint', label: 'НАЧИСЛЕНИЕ', icon: CoinsIcon },
  { path: '/exchange-rates', label: 'КУРСЫ', icon: ChartIcon },
  { path: '/history', label: 'ЖУРНАЛ', icon: HistoryIcon },
];

export function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        style={{
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
        className="flex-shrink-0 px-4 py-3 flex items-center justify-between relative z-10"
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 24,
              height: 24,
              background: '#2E5BFF',
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
            }}
          />
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '0.12em',
              color: '#E0E0E0',
            }}
          >
            LOYAL<span style={{ color: '#2E5BFF' }}>X</span>
          </span>
        </div>
        <div className="scale-[0.82] origin-right" style={{ filter: 'saturate(0) brightness(1.8)' }}>
          <TonConnectButton />
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        style={{
          background: 'rgba(10,10,10,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 min-w-[44px]"
                style={{ transition: 'opacity 0.15s' }}
              >
                <Icon active={active} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    color: active ? '#2E5BFF' : 'rgba(224,224,224,0.35)',
                    transition: 'color 0.15s',
                  }}
                >
                  {label}
                </span>
                {active && (
                  <div
                    style={{
                      width: 16,
                      height: 1,
                      background: '#2E5BFF',
                      boxShadow: '0 0 6px rgba(46,91,255,0.8)',
                      marginTop: 1,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E5BFF' : 'rgba(224,224,224,0.35)'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E5BFF' : 'rgba(224,224,224,0.35)'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="3" y="3" width="18" height="18" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}

function SwapIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E5BFF' : 'rgba(224,224,224,0.35)'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function CoinsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E5BFF' : 'rgba(224,224,224,0.35)'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E5BFF' : 'rgba(224,224,224,0.35)'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 6-6" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E5BFF' : 'rgba(224,224,224,0.35)'} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M12 8v4l3 3" />
      <path d="M3.05 11a9 9 0 1 0 .5-3" />
      <path d="M3 4v4h4" />
    </svg>
  );
}
