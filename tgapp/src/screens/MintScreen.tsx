import { useState, useEffect } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import { ContractService } from '../services/contractService';
import toast from 'react-hot-toast';

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

    const load = async () => {
      setLoadingBrands(true);
      try {
        const brandAddresses = await contractService.getAllBrands();
        const results: Brand[] = [];

        for (const brandAddr of brandAddresses) {
          const info = await contractService.getBrandInfo(brandAddr);
          // показываем только бренды этого пользователя
          if (!info || info.admin.toString() !== address.toString()) continue;

          const meta = info.content
            ? contractService.parseBrandMetadata(info.content)
            : { name: 'Unknown', symbol: '???', description: '', image: '' };

          results.push({ address: brandAddr, name: meta.name, symbol: meta.symbol });
        }

        setBrands(results);
      } catch (error) {
        console.error('MintScreen load error:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    load();
  }, [connected, address, contractService]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService) return;

    if (!ContractService.isValidAddress(recipient)) {
      toast.error('Некорректный адрес получателя');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Укажите количество токенов');
      return;
    }

    setLoading(true);
    try {
      const msg = contractService.buildMintPayload({
        brandAddress: Address.parse(selectedBrand),
        to: Address.parse(recipient),
        amount: toNano(amount),
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });

      toast.success('Токены начислены! Транзакция в блокчейне.');
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Mint error:', error);
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
        <p className="text-gray-400 text-sm">Подключите кошелёк для начисления токенов</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Начислить токены</h2>

      {loadingBrands ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-sm">У вас нет брендов</p>
          <p className="text-gray-400 text-xs mt-1">Сначала создайте бренд</p>
        </div>
      ) : (
        <form onSubmit={handleMint} className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Бренд</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите бренд</option>
                {brands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString()}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Адрес получателя</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                placeholder="EQD..."
                required
              />
              {recipient && !ContractService.isValidAddress(recipient) && (
                <p className="text-red-500 text-xs mt-1">Некорректный адрес</p>
              )}
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
          </div>

          <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-600">
            <p>Газ: ~0.15 TON</p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedBrand}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка...' : 'Начислить'}
          </button>
        </form>
      )}
    </div>
  );
}
