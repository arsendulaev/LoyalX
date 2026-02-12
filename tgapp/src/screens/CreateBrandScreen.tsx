import { useState } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';

export function CreateBrandScreen() {
  const { connected } = useTonConnect();
  const [brandName, setBrandName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;

    setLoading(true);
    try {
      // TODO: Интеграция с контрактом Factory
      console.log('Creating brand:', { brandName, ticker, description });
      alert('Функция создания бренда будет реализована после интеграции с контрактами');
    } catch (error) {
      console.error('Error creating brand:', error);
      alert('Ошибка при создании бренда');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Создание бренда
          </h2>
          <p className="text-gray-600 mb-6">
            Подключите кошелёк для создания своего бренда
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Создать новый бренд
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
              Название бренда
            </label>
            <input
              type="text"
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Coffee Shop"
              required
            />
          </div>

          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-2">
              Тикер токена (3-4 символа)
            </label>
            <input
              type="text"
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="COF"
              maxLength={4}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Описание вашего бренда и программы лояльности"
              rows={4}
            />
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">Важно знать:</h3>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Создание бренда требует оплаты газа (~0.5 TON)</li>
              <li>• После создания вы станете владельцем контракта</li>
              <li>• Вы сможете минтить токены для пользователей</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать бренд'}
          </button>
        </form>
      </div>
    </div>
  );
}
