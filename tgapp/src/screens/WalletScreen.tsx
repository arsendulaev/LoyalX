import { useTonConnect } from '../hooks/useTonConnect';

export function WalletScreen() {
  const { address, connected } = useTonConnect();

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Мой кошелёк</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Адрес кошелька:</p>
          <p className="font-mono text-sm break-all">{address?.toString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Мои токены</h3>
        <div className="text-center py-8 text-gray-500">
          <p>У вас пока нет токенов лояльности</p>
          <p className="text-sm mt-2">
            Получите токены от брендов или обменяйте существующие
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Что такое LoyalX?</h3>
        <p className="text-indigo-100 mb-4">
          LoyalX - это децентрализованная система лояльности на блокчейне TON.
          Получайте токены от брендов и обменивайте их между собой!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl mb-2">🎁</div>
            <p className="font-semibold">Получайте</p>
            <p className="text-sm text-indigo-100">Токены от брендов</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl mb-2">🔄</div>
            <p className="font-semibold">Обменивайте</p>
            <p className="text-sm text-indigo-100">Между брендами</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl mb-2">🏪</div>
            <p className="font-semibold">Используйте</p>
            <p className="text-sm text-indigo-100">В партнёрских магазинах</p>
          </div>
        </div>
      </div>
    </div>
  );
}
