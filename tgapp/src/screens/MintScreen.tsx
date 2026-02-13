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

export function MintScreen() {
  const { address, connected } = useTonConnect();
  const contractService = useContract();
  const [tonConnectUI] = useTonConnectUI();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    if (!connected || !address || !contractService) return;

    const loadBrands = async () => {
      setLoadingBrands(true);
      try {
        const brandAddresses = await contractService.getAllBrands();
        
        const brandsWithInfo = await Promise.all(
          brandAddresses.map(async (brandAddress) => {
            const brandInfo = await contractService.getBrandInfo(brandAddress);
            
            if (!brandInfo || brandInfo.admin.toString() !== address.toString()) {
              return null;
            }

            let name = 'Unknown Brand';
            let symbol = '???';
            
            if (brandInfo.content) {
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
        
        setBrands(brandsWithInfo.filter((b): b is Brand => b !== null));
      } catch (error) {
        console.error('Error loading brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    loadBrands();
  }, [connected, address, contractService]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService) return;

    setLoading(true);
    try {
      const { brand, message, value } = await contractService.createMintMessage({
        brandAddress: Address.parse(selectedBrand),
        to: Address.parse(recipient),
        amount: toNano(amount),
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: brand.address.toString(),
          amount: value.toString(),
          payload: beginCell()
            .storeUint(405076230, 32)
            .storeAddress(message.to)
            .storeCoins(message.amount)
            .endCell()
            .toBoc()
            .toString('base64'),
        }],
      });

      alert('Токены успешно начислены! Транзакция отправлена в блокчейн.');
      
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Error minting:', error);
      alert('Ошибка при начислении токенов: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
            Начисление токенов
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Подключите кошелёк для начисления токенов
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
          Начислить токены
        </h2>
        
        {loadingBrands ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 mt-2">Загрузка брендов...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>У вас нет брендов для начисления токенов</p>
            <p className="text-sm mt-2">Создайте бренд, чтобы начислять токены пользователям</p>
          </div>
        ) : (
          <form onSubmit={handleMint} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Выберите бренд
              </label>
              <select
                id="brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
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
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                Адрес получателя
              </label>
              <input
                type="text"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-xs sm:text-sm"
                placeholder="EQD..."
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Количество токенов
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                placeholder="100"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="bg-indigo-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">Информация:</h3>
              <ul className="text-xs sm:text-sm text-indigo-700 space-y-1">
                <li>• Вы можете начислять токены только своих брендов</li>
                <li>• Получатель должен иметь кошелёк TON</li>
                <li>• Транзакция требует оплаты газа (~0.1 TON)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBrand}
              className="w-full bg-indigo-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Начисление...' : 'Начислить токены'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
