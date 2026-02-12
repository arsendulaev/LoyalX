import { useState } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';

export function SwapScreen() {
  const { connected } = useTonConnect();
  const [fromBrand, setFromBrand] = useState('');
  const [toBrand, setToBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;

    setLoading(true);
    try {
      // TODO: Интеграция с контрактом для обмена
      console.log('Swapping:', { fromBrand, toBrand, amount });
      alert('Функция обмена будет реализована после интеграции с контрактами');
    } catch (error) {
      console.error('Error swapping:', error);
      alert('Ошибка при обмене');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Обмен токенов
          </h2>
          <p className="text-gray-600 mb-6">
            Подключите кошелёк для обмена токенов
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Обмен токенов лояльности
        </h2>
        
        <form onSubmit={handleSwap} className="space-y-6">
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
              <option value="COF">Coffee Shop (COF)</option>
              <option value="BRG">Burger Place (BRG)</option>
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
            <div className="bg-gray-100 rounded-full p-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <option value="COF">Coffee Shop (COF)</option>
              <option value="BRG">Burger Place (BRG)</option>
            </select>
          </div>

          {fromBrand && toBrand && amount && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Вы получите: <span className="font-semibold">~{amount} {toBrand}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Курс обмена зависит от настроек брендов
              </p>
            </div>
          )}

          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Как это работает:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Токены отправляются в контракт целевого бренда</li>
              <li>• Применяется курс обмена, установленный брендом</li>
              <li>• Вы получаете новые токены на свой кошелёк</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !fromBrand || !toBrand || fromBrand === toBrand}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Обмен...' : 'Обменять токены'}
          </button>
        </form>
      </div>
    </div>
  );
}
