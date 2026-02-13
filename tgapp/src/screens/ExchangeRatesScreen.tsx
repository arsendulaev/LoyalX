import { useState, useEffect } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { ContractService } from '../services/contractService';
import toast from 'react-hot-toast';

interface Brand {
  address: Address;
  name: string;
  symbol: string;
  isOwner: boolean;
}

export function ExchangeRatesScreen() {
  const { address, connected } = useTonConnect();
  const contractService = useContract();
  const [tonConnectUI] = useTonConnectUI();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [myBrand, setMyBrand] = useState('');
  const [targetBrand, setTargetBrand] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    if (!connected || !address || !contractService) return;

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

          results.push({
            address: brandAddr,
            name: meta.name,
            symbol: meta.symbol,
            isOwner: info.admin.toString() === address.toString(),
          });
        }

        setBrands(results);
      } catch (error) {
        console.error('ExchangeRatesScreen load error:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    load();
  }, [connected, address]); // убрал contractService из dependencies

  const myBrands = brands.filter(b => b.isOwner);
  const otherBrands = brands.filter(b => b.address.toString() !== myBrand);

  const handleSetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService || !address) return;

    if (!rate || Number(rate) <= 0) {
      toast.error('Укажите курс больше 0');
      return;
    }

    setLoading(true);
    try {
      // для SetExchangeRate нужен адрес JettonWallet входящего токена при данном BrandJetton
      // то есть адрес кошелька targetBrand у myBrand контракта
      const targetBrandAddress = Address.parse(targetBrand);
      const myBrandAddress = Address.parse(myBrand);

      // адрес кошелька, с которого будут приходить токены при обмене
      // это JettonWallet контракта myBrand, принадлежащий targetBrand
      // нет! exchangeRates хранит: [адрес кошелька входящего токена] -> курс
      // при swap: пользователь отправляет Transfer из своего walletA -> BrandB
      // BrandB получает TransferNotification от walletA контракта, ctx.sender = адрес walletA
      // exchangeRates[ctx.sender] должен быть установлен
      // ctx.sender при Transfer = JettonWallet of BrandA for user
      // но мы не знаем адрес кошелька конкретного пользователя
      // в реальности, JettonWallet контрактов определяется по initOf JettonWallet(owner, master)
      // тут owner = пользователь, master = BrandA
      // => ctx.sender = contractAddress(initOf JettonWallet(user, BrandA))
      // но мы не можем установить курс для каждого пользователя

      // Проверим контракт: exchangeRates.get(ctx.sender)
      // ctx.sender при TransferNotification в BrandB = адрес JettonWallet отправителя
      // Для универсального курса нам нужен "мастер-адрес" а не пользовательский wallet

      // Хм, это архитектурная проблема. SetExchangeRate принимает jettonWalletAddress,
      // но при обмене ctx.sender будет user's JettonWallet (уникальный для каждого пользователя).
      // Значит текущая архитектура обмена не рабочая для произвольных пользователей.

      // Пока установим курс для конкретного walletAddress (для тестирования можно указать адрес
      // кошелька конкретного пользователя). В будущем нужен рефакторинг контракта.

      // Для тестирования: установим курс для JettonWallet текущего пользователя
      const jettonWalletAddr = await contractService.getUserWalletAddress(targetBrandAddress, address);

      const msg = contractService.buildSetExchangeRatePayload({
        brandAddress: myBrandAddress,
        jettonWalletAddress: jettonWalletAddr,
        rate: BigInt(Math.round(Number(rate) * 100)), // курс с точностью до 0.01
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });

      toast.success('Курс обмена установлен!');
      setRate('');
    } catch (error) {
      console.error('SetExchangeRate error:', error);
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
        <p className="text-gray-400 text-sm">Подключите кошелёк для настройки курсов</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Курсы обмена</h2>

      {loadingBrands ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : myBrands.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-sm">У вас нет брендов</p>
          <p className="text-gray-400 text-xs mt-1">Создайте бренд, чтобы настраивать курсы обмена</p>
        </div>
      ) : (
        <form onSubmit={handleSetRate} className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ваш бренд</label>
              <select
                value={myBrand}
                onChange={(e) => setMyBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите свой бренд</option>
                {myBrands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString()}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Принимаемый токен</label>
              <select
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите входящий токен</option>
                {otherBrands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString()}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Курс (сколько ваших токенов за 1 входящий)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                placeholder="1.5"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          {myBrand && targetBrand && rate && (
            <div className="bg-blue-50/80 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p>
                1 {otherBrands.find(b => b.address.toString() === targetBrand)?.symbol || '???'} ={' '}
                {rate} {myBrands.find(b => b.address.toString() === myBrand)?.symbol || '???'}
              </p>
              <p className="text-blue-500">
                Курс устанавливается для текущего подключённого кошелька
              </p>
            </div>
          )}

          <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-600">
            <p>Газ: ~0.05 TON</p>
          </div>

          <button
            type="submit"
            disabled={loading || !myBrand || !targetBrand}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка...' : 'Установить курс'}
          </button>
        </form>
      )}
    </div>
  );
}
