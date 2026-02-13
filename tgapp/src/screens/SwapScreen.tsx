import { useState, useEffect } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import toast from 'react-hot-toast';

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

    const load = async () => {
      setLoadingBrands(true);
      try {
        const brandAddresses = await contractService.getAllBrands();
        const results: Brand[] = [];

        for (const brandAddr of brandAddresses) {
          const info = await contractService.getBrandInfo(brandAddr);
          if (!info) continue;

          const meta = info.content
            ? contractService.parseBrandMetadata(info.content)
            : { name: 'Unknown', symbol: '???', description: '', image: '' };

          results.push({ address: brandAddr, name: meta.name, symbol: meta.symbol });
        }

        setBrands(results);
      } catch (error) {
        console.error('SwapScreen load error:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    load();
  }, [connected]); // убрал contractService из dependencies

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !contractService || !address) return;

    if (fromBrand === toBrand) {
      toast.error('Нельзя обменять токен на тот же самый');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Укажите количество');
      return;
    }

    setLoading(true);
    try {
      const msg = await contractService.buildSwapPayload({
        fromBrandAddress: Address.parse(fromBrand),
        toBrandAddress: Address.parse(toBrand),
        amount: toNano(amount),
        userAddress: address,
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });

      toast.success('Обмен отправлен! Ожидайте подтверждения.');
      setAmount('');
    } catch (error) {
      console.error('Swap error:', error);
      const msg = (error as Error).message;
      if (msg.includes('Interrupted') || msg.includes('cancel')) {
        toast('Отменено', { icon: '✕' });
      } else {
        toast.error('Ошибка: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">Подключите кошелёк для обмена токенов</p>
      </div>
    );
  }

  const fromBrandInfo = brands.find(b => b.address.toString() === fromBrand);
  const toBrandInfo = brands.find(b => b.address.toString() === toBrand);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Обмен токенов</h2>

      {loadingBrands ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : brands.length < 2 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-sm">Для обмена нужно минимум 2 бренда</p>
          <p className="text-gray-400 text-xs mt-1">Пока создано: {brands.length}</p>
        </div>
      ) : (
        <form onSubmit={handleSwap} className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            {/* отдаю */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Отдаю</label>
              <select
                value={fromBrand}
                onChange={(e) => setFromBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите токен</option>
                {brands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString()}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Количество</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                placeholder="100"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* разделитель */}
            <div className="flex items-center justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>

            {/* получаю */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Получаю</label>
              <select
                value={toBrand}
                onChange={(e) => setToBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите токен</option>
                {brands.filter(b => b.address.toString() !== fromBrand).map((b) => (
                  <option key={b.address.toString()} value={b.address.toString()}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fromBrandInfo && toBrandInfo && amount && (
            <div className="bg-amber-50/80 rounded-xl p-3 text-xs text-amber-700">
              <p>Обмен {amount} {fromBrandInfo.symbol} на {toBrandInfo.symbol}</p>
              <p className="mt-0.5">Курс определяется контрактом бренда-получателя</p>
            </div>
          )}

          <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-600">
            <p>Газ: ~0.25 TON</p>
          </div>

          <button
            type="submit"
            disabled={loading || !fromBrand || !toBrand}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка...' : 'Обменять'}
          </button>
        </form>
      )}
    </div>
  );
}
