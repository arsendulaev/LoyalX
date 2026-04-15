import { useState } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useTonConnectUI } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { getUserJettons } from '../services/tonApiService';

export function CreateBrandScreen() {
  const { connected, address } = useTonConnect();
  const contractService = useContract();
  const [tonConnectUI] = useTonConnectUI();
  const [brandName, setBrandName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      toast.error('Подключите кошелёк');
      return;
    }
    
    if (!contractService) {
      toast.error('Инициализация... Попробуйте ещё раз');
      return;
    }

    if (!brandName.trim() || !ticker.trim()) {
      toast.error('Заполните название и тикер');
      return;
    }

    setLoading(true);
    try {
      const isActive = await contractService.checkFactoryActive();
      if (!isActive) {
        toast.error('Factory контракт не развёрнут. Сначала задеплойте его.');
        return;
      }

      const msg = contractService.buildCreateBrandPayload({
        name: brandName.trim(),
        description: description.trim(),
        symbol: ticker.trim(),
        image: imageUrl.trim() || 'https://via.placeholder.com/150',
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });

      toast.success('Транзакция отправлена! Ждём подтверждения...');
      contractService.clearCache();
      let appeared = false;
      if (address) {
        const userAddrStr = address.toString({ urlSafe: true, bounceable: true });
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const jettons = await getUserJettons(userAddrStr);
            const tickerUpper = ticker.trim().toUpperCase();
            if (jettons.some(j => j.symbol?.toUpperCase() === tickerUpper)) {
              appeared = true;
              break;
            }
          } catch {}
        }
      }

      contractService.clearCache();
      setBrandName('');
      setTicker('');
      setDescription('');
      setImageUrl('');
      toast.success(appeared ? 'Бренд создан!' : 'Бренд создан! Может появиться в кошельке через минуту.');
    } catch (error) {
      console.error('CreateBrand error:', error);
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
        <p className="text-gray-400 text-sm">Подключите кошелёк для создания бренда</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Создать бренд</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Название</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              placeholder="Coffee Shop"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Тикер (3-4 символа)</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              placeholder="COF"
              maxLength={4}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
              placeholder="Программа лояльности кофейни"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">URL логотипа</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-600 space-y-1">
          <p>Газ: ~1.1 TON</p>
          <p>Вы станете владельцем контракта бренда</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Отправка...' : 'Создать бренд'}
        </button>
      </form>
    </div>
  );
}
