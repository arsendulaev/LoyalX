import { Link, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';

const tabs = [
  { path: '/wallet', label: 'Кошелёк', icon: WalletIcon },
  { path: '/create-brand', label: 'Бренд', icon: PlusIcon },
  { path: '/swap', label: 'Обмен', icon: SwapIcon },
  { path: '/mint', label: 'Минт', icon: CoinsIcon },
  { path: '/exchange-rates', label: 'Курсы', icon: ChartIcon },
];

export function Navigation() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex-shrink-0 px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          LoyalX
        </h1>
        <div className="scale-[0.85] origin-right">
          <TonConnectButton />
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200/50 safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {tabs.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[56px] ${
                isActive(path)
                  ? 'text-indigo-600'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon active={isActive(path)} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4f46e5' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4f46e5' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function SwapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4f46e5' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function CoinsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4f46e5' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#4f46e5' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 6-6" />
    </svg>
  );
}
