import { Link, useLocation } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg flex-shrink-0">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-8">
            <h1 className="text-lg sm:text-2xl font-bold text-indigo-600 hidden sm:block">LoyalX</h1>
            <div className="flex space-x-1 sm:space-x-4">
              <Link
                to="/wallet"
                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/wallet')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Кошелёк
              </Link>
              <Link
                to="/create-brand"
                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/create-brand')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Бренд
              </Link>
              <Link
                to="/swap"
                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/swap')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Обмен
              </Link>
              <Link
                to="/mint"
                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/mint')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Начислить
              </Link>
            </div>
          </div>
          <div className="scale-75 sm:scale-100 origin-right">
            <TonConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
