import { useState, useEffect } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { Address } from '@ton/core';

interface TokenBalance {
  brand: Address;
  balance: bigint;
  name: string;
  symbol: string;
}

export function WalletScreen() {
  const { address, connected } = useTonConnect();
  const contractService = useContract();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBalances = async (forceRefresh = false) => {
    if (!connected || !address || !contractService) return;
    
    if (forceRefresh) {
      contractService.clearCache();
    }
    
    setLoading(true);
    try {
      console.log('Loading balances for:', address.toString());
      const data = await contractService.getUserBalances(address, true); // показываем ВСЕ бренды (включая нулевые)
      console.log('Loaded balances:', data.length, 'brands');
      data.forEach(d => {
        console.log(`Brand ${d.meta.name} (${d.meta.symbol}):`, Number(d.balance) / 1e9, 'tokens');
      });
      
      setBalances(data.map(d => ({
        brand: d.brand,
        balance: d.balance,
        name: d.meta.name,
        symbol: d.meta.symbol,
      })));
    } catch (error) {
      console.error('WalletScreen load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!connected || !address || !contractService) return;
    
    loadBalances();
    
    // автообновление каждые 10 секунд
    const interval = setInterval(loadBalances, 10000);
    return () => clearInterval(interval);
  }, [connected, address]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">LoyalX</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Подключите кошелёк TON чтобы начать работу с системой лояльности
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* адрес кошелька */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs text-gray-400">Мой кошелёк</p>
          <button
            onClick={() => loadBalances(true)}
            disabled={loading}
            className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            title="Обновить балансы"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">
          {address?.toString()}
        </p>
      </div>

      {/* токены */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Мои токены</h3>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Нет брендов</p>
            <p className="text-gray-300 text-xs mt-1">Создайте бренд и начислите токены</p>
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map(({ brand, balance, name, symbol }) => {
              const isZero = balance === 0n;
              return (
                <div
                  key={brand.toString()}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isZero ? 'bg-gray-100/50 opacity-60' : 'bg-gray-50/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isZero ? 'text-gray-500' : 'text-gray-800'}`}>
                      {name} {isZero && <span className="text-xs text-gray-400">(нет токенов)</span>}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {brand.toString().slice(0, 6)}...{brand.toString().slice(-4)}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`text-base font-bold ${isZero ? 'text-gray-400' : 'text-indigo-600'}`}>
                      {(Number(balance) / 1e9).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">{symbol}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
