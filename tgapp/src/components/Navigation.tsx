import { Link, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-indigo-600">LoyalX</h1>
            <div className="flex space-x-4">
              <Link
                to="/wallet"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/wallet')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Кошелёк
              </Link>
              <Link
                to="/create-brand"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/create-brand')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Создать бренд
              </Link>
              <Link
                to="/swap"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/swap')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Обмен
              </Link>
            </div>
          </div>
          <TonConnectButton />
        </div>
      </div>
    </nav>
  );
}
