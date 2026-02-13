import { useState, useEffect } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { Address } from '@ton/core';

interface TokenBalance {
  brand: Address;
  balance: bigint;
  brandInfo: {
    name: string;
    symbol: string;
  } | null;
}

export function WalletScreen() {
  const { address, connected } = useTonConnect();
  const contractService = useContract();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !address || !contractService) return;

    const loadBalances = async () => {
      setLoading(true);
      try {
        const userBalances = await contractService.getUserBalances(address);
        
        const balancesWithInfo = await Promise.all(
          userBalances.map(async ({ brand, balance }) => {
            const brandInfo = await contractService.getBrandInfo(brand);
            let name = 'Unknown Brand';
            let symbol = '???';
            
            if (brandInfo && brandInfo.content) {
              try {
                const contentSlice = brandInfo.content.beginParse();
                const tag = contentSlice.loadUint(8);
                if (tag === 0x01) {
                  const jsonStr = contentSlice.loadStringTail();
                  const metadata = JSON.parse(jsonStr);
                  name = metadata.name || name;
                  symbol = metadata.symbol || symbol;
                }
              } catch (e) {
                console.error('Error parsing brand metadata:', e);
              }
            }
            
            return {
              brand,
              balance,
              brandInfo: { name, symbol },
            };
          })
        );
        
        setBalances(balancesWithInfo);
      } catch (error) {
        console.error('Error loading balances:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [connected, address, contractService]);

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Добро пожаловать в LoyalX!
          </h2>
          <p className="text-gray-600 mb-6">
            Подключите кошелёк TON для начала работы с системой лояльности
          </p>
          <div className="inline-block px-6 py-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600">
              Нажмите "Connect Wallet" в правом верхнем углу
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Мой кошелёк</h2>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Адрес кошелька:</p>
          <p className="font-mono text-xs sm:text-sm break-all">{address?.toString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Мои токены</h3>
        
        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Загрузка токенов...</p>
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="text-sm sm:text-base">У вас пока нет токенов лояльности</p>
            <p className="text-xs sm:text-sm mt-2">
              Получите токены от брендов или обменяйте существующие
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {balances.map(({ brand, balance, brandInfo }) => (
              <div
                key={brand.toString()}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm sm:text-base font-semibold text-gray-800">
                    {brandInfo?.name || 'Unknown Brand'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-mono">
                    {brand.toString().slice(0, 8)}...{brand.toString().slice(-6)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base sm:text-lg font-bold text-indigo-600">
                    {(Number(balance) / 1e9).toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{brandInfo?.symbol || '???'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
