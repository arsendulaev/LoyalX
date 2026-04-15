import { useState } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useBrands } from '../hooks/useBrands';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import { ContractService } from '../services/contractService';
import { CheckoutQR } from '../components/CheckoutQR';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast from 'react-hot-toast';

export function MintScreen() {
  const { address, connected } = useTonConnect();
  const contractService = useContract();
  const { brands } = useBrands();
  const [tonConnectUI] = useTonConnectUI();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const ownedBrands = brands.filter(b => b.isOwner);

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
        to: Address.parse(ContractService.toBounceable(recipient)),
        amount: toNano(amount),
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [msg],
      });

      toast.success('Токены начислены!');
      setRecipient('');
      setAmount('');
    } catch (error) {
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
      {checkoutOpen && (
        <CheckoutQR
          brands={ownedBrands.map(b => ({ address: b.address, name: b.name, symbol: b.symbol }))}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {scanOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-white text-lg font-semibold">Сканировать адрес клиента</h2>
            <button onClick={() => setScanOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="flex-1 relative">
            <Scanner
              onScan={(results) => {
                if (!results.length) return;
                const raw = results[0].rawValue;
                let addr = raw;
                if (raw.startsWith('ton://transfer/')) {
                  try { addr = new URL(raw.replace('ton://transfer/', 'https://x.x/')).pathname.replace('/', ''); } catch {}
                }
                if (ContractService.isValidAddress(addr)) {
                  setRecipient(addr);
                  setScanOpen(false);
                  toast.success('Адрес получателя заполнен');
                } else {
                  toast.error('Не удалось распознать адрес');
                }
              }}
              onError={() => toast.error('Нет доступа к камере')}
              constraints={{ facingMode: 'environment' }}
              styles={{ container: { width: '100%', height: '100%' } }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white rounded-2xl opacity-70" />
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center py-4">Наведите на QR-код с адресом клиента</p>
        </div>
      )}
      <h2 className="text-lg font-bold text-gray-800">Начислить токены</h2>

      {ownedBrands.length > 0 && (
        <button
          onClick={() => setCheckoutOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-2xl shadow-md transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>
          </svg>
          Сгенерировать QR для списания
        </button>
      )}

      {ownedBrands.length === 0 ? (
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
                {ownedBrands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString()}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Адрес получателя</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  placeholder="EQD… или 0QD…"
                  required
                />
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  title="Сканировать QR"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>
                  </svg>
                </button>
                {address && (
                  <button
                    type="button"
                    onClick={() => setRecipient(address.toString())}
                    className="px-3 py-2.5 bg-indigo-100 text-indigo-600 rounded-xl text-xs font-medium hover:bg-indigo-200 transition-colors"
                  >
                    Себе
                  </button>
                )}
              </div>
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
            <p>Газ: ~0.2 TON</p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedBrand}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка…' : 'Начислить'}
          </button>
        </form>
      )}
    </div>
  );
}
