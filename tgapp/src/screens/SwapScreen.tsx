import { useState, useEffect } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano, beginCell } from '@ton/core';

interface Brand {
  address: Address;
  name: string;
  symbol: string;
}

export function SwapScreen() {
  const { connected, address } = useTonConnect();
  const contractService = useContract();
  const [tonConnectUI] = useTonConnectUI();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [fromBrand, setFromBrand] = useState('');
  const [toBrand, setToBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    if (!connected || !contractService) return;

    const loadBrands = async () => {
      setLoadingBrands(true);
      try {
        const brandAddresses = await contractService.getAllBrands();
        
        const brandsWithInfo = await Promise.all(
          brandAddresses.map(async (brandAddress) => {
            const brandInfo = await contractService.getBrandInfo(brandAddress);
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
              address: brandAddress,
              name,
              symbol,
            };
          })
        );
        
        setBrands(brandsWithInfo);
      } catch (error) {
        console.error('Error loading brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    loadBrands();
  }, [connected, contractService]);

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !contractService || !address) return;

    setLoading(true);
    try {
      const fromBrandAddress = Address.parse(fromBrand);
      const toBrandAddress = Address.parse(toBrand);
      const amountNano = toNano(amount);

      const { wallet, message, value } = await contractService.createSwapMessage({
        fromBrandAddress,
        toBrandAddress,
        amount: amountNano,
        userAddress: address,
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: wallet.address.toString(),
            amount: value.toString(),
            payload: beginCell()
              .storeUint(260734629, 32)
              .storeUint(message.queryId, 64)
              .storeCoins(message.amount)
              .storeAddress(message.destination)
              .storeAddress(message.responseDestination)
              .storeMaybeRef(message.customPayload)
              .storeCoins(message.forwardTonAmount)
              .storeSlice(message.forwardPayload)
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      });

      alert('Обмен успешно выполнен! Транзакция отправлена в блокчейн.');
      
      setAmount('');
    } catch (error) {
      console.error('Error swapping:', error);
      alert('Ошибка при обмене: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
            Обмен токенов
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Подключите кошелёк для обмена токенов
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
          Обмен токенов лояльности
        </h2>
        
        {loadingBrands ? (
          <div className="text-center py-6 sm:py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Загрузка брендов...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="text-sm sm:text-base">Нет доступных брендов для обмена</p>
            <p className="text-xs sm:text-sm mt-2">Создайте бренд или дождитесь появления брендов в системе</p>
          </div>
        ) : (
          <form onSubmit={handleSwap} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="fromBrand" className="block text-sm font-medium text-gray-700 mb-2">
                Отдаю
              </label>
              <select
                id="fromBrand"
                value={fromBrand}
                onChange={(e) => setFromBrand(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Выберите бренд</option>
                {brands.map((brand) => (
                  <option key={brand.address.toString()} value={brand.address.toString()}>
                    {brand.name} ({brand.symbol})
                  </option>
                ))}
              </select>
            </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Количество
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-full p-2 sm:p-3">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>

            <div>
              <label htmlFor="toBrand" className="block text-sm font-medium text-gray-700 mb-2">
                Получаю
              </label>
              <select
                id="toBrand"
                value={toBrand}
                onChange={(e) => setToBrand(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Выберите бренд</option>
                {brands.map((brand) => (
                  <option key={brand.address.toString()} value={brand.address.toString()}>
                    {brand.name} ({brand.symbol})
                  </option>
                ))}
              </select>
            </div>

            {fromBrand && toBrand && amount && (
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-900">
                  Вы получите: <span className="font-semibold">~{amount} {brands.find(b => b.address.toString() === toBrand)?.symbol}</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Курс обмена зависит от настроек брендов
                </p>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 hidden sm:block">
              <h3 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">Как это работает:</h3>
              <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                <li>• Токены отправляются в контракт целевого бренда</li>
                <li>• Применяется курс обмена, установленный брендом</li>
                <li>• Вы получаете новые токены на свой кошелёк</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !fromBrand || !toBrand || fromBrand === toBrand}
              className="w-full bg-indigo-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Обмен...' : 'Обменять токены'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
