import { useState, useEffect, useRef } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useBrands } from '../hooks/useBrands';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import toast from 'react-hot-toast';

export function SwapScreen() {
  const { connected, address } = useTonConnect();
  const contractService = useContract();
  const { brands } = useBrands();
  const [tonConnectUI] = useTonConnectUI();
  const [fromBrand, setFromBrand] = useState('');
  const [toBrand, setToBrand] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [activePairs, setActivePairs] = useState<{ brandAddr: string; symbol: string; name: string; rate: number }[]>([]);
  const [pairsLoading, setPairsLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!fromBrand || !contractService) {
      setActivePairs([]);
      return;
    }
    const myReqId = ++requestIdRef.current;
    const fromAddr = Address.parse(fromBrand);
    const fromRaw = fromAddr.toRawString();
    const others = brands
      .filter(b => b.address.toRawString() !== fromRaw)
      .map(b => b.address);

    if (others.length === 0) { setActivePairs([]); return; }

    setPairsLoading(true);
    contractService.getActivePairs(fromAddr, others).then(pairs => {
      if (requestIdRef.current !== myReqId) return;
      const entries = pairs.map(p => {
        const info = brands.find(b => b.address.toRawString() === p.brand.toRawString());
        return {
          brandAddr: p.brand.toString({ urlSafe: true, bounceable: true }),
          symbol: info?.symbol ?? '???',
          name: info?.name ?? p.brand.toString().slice(0, 8) + '…',
          rate: p.rate,
        };
      });
      setActivePairs(entries);
    }).finally(() => {
      if (requestIdRef.current === myReqId) setPairsLoading(false);
    });
  }, [fromBrand, contractService, brands]);

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
    const pair = activePairs.find(p => p.brandAddr === toBrand);
    if (!pair) {
      toast.error('Курс обмена не установлен для этой пары');
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

  const fromBrandInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === fromBrand);
  const toBrandInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === toBrand);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Обмен токенов</h2>

      {brands.length < 2 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 text-sm">Для обмена нужно минимум 2 бренда</p>
          <p className="text-gray-400 text-xs mt-1">Пока создано: {brands.length}</p>
        </div>
      ) : (
        <form onSubmit={handleSwap} className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Отдаю</label>
              <select
                value={fromBrand}
                onChange={(e) => { setFromBrand(e.target.value); setToBrand(''); }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите токен</option>
                {brands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString({ urlSafe: true, bounceable: true })}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            {fromBrand && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Доступные обмены</p>
                {pairsLoading ? (
                  <p className="text-xs text-gray-400 animate-pulse">Загружаем курсы…</p>
                ) : activePairs.length === 0 ? (
                  <p className="text-xs text-gray-400">Нет активных курсов для этого токена</p>
                ) : (
                  <div className="space-y-1">
                    {activePairs.map(pair => (
                      <button
                        key={pair.brandAddr}
                        type="button"
                        onClick={() => setToBrand(pair.brandAddr)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          toBrand === pair.brandAddr
                            ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium">{fromBrandInfo?.symbol ?? '?'} → {pair.symbol}</span>
                        <span className="text-gray-500">
                          1 {fromBrandInfo?.symbol} = {(pair.rate / 1000).toFixed(3).replace(/\.?0+$/, '')} {pair.symbol}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            <div className="flex items-center justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Получаю</label>
              {toBrand && toBrandInfo ? (
                <div className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800 font-medium">
                  {toBrandInfo.name} ({toBrandInfo.symbol})
                </div>
              ) : (
                <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400">
                  Выберите курс выше
                </div>
              )}
            </div>
          </div>

          {fromBrandInfo && toBrandInfo && amount && (
            <div className="bg-amber-50/80 rounded-xl p-3 text-xs text-amber-700">
              <p>Обмен {amount} {fromBrandInfo.symbol} → {toBrandInfo.symbol}</p>
              {activePairs.find(p => p.brandAddr === toBrand) && (
                <p className="mt-0.5 font-medium">
                  ≈ {(Number(amount) * (activePairs.find(p => p.brandAddr === toBrand)!.rate / 1000)).toLocaleString('ru', { maximumFractionDigits: 4 })} {toBrandInfo.symbol}
                </p>
              )}
            </div>
          )}

          <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-600">
            <p>Газ: ~0.5 TON</p>
          </div>

          <button
            type="submit"
            disabled={loading || !fromBrand || !toBrand || !activePairs.some(p => p.brandAddr === toBrand)}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка...' : 'Обменять'}
          </button>
        </form>
      )}
    </div>
  );
}
