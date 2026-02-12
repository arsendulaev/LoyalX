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

  useEffect(() => {
    if (!connected || !address || !contractService) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await contractService.getUserBalances(address);
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

    load();
  }, [connected, address, contractService]);

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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Мой кошелёк</p>
        <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">
          {address?.toString()}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Мои токены</h3>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Нет токенов</p>
            <p className="text-gray-300 text-xs mt-1">Получите от брендов или обменяйте</p>
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map(({ brand, balance, name, symbol }) => (
              <div
                key={brand.toString()}
                className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {brand.toString().slice(0, 6)}...{brand.toString().slice(-4)}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-base font-bold text-indigo-600">
                    {(Number(balance) / 1e9).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">{symbol}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
