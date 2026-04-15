import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useBrands } from '../hooks/useBrands';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import toast from 'react-hot-toast';

interface InboxEntry {
  proposerAddress: string;
  proposerName: string;
  proposerSymbol: string;
  myBrandAddress: string;
  myBrandName: string;
  myBrandSymbol: string;
  rate: number;
}

export function ExchangeRatesScreen() {
  const { connected } = useTonConnect();
  const contractService = useContract();
  const { brands } = useBrands();
  const [tonConnectUI] = useTonConnectUI();

  const [myBrand, setMyBrand] = useState('');
  const [targetBrand, setTargetBrand] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);

  const [inbox, setInbox] = useState<InboxEntry[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);

  const myBrands = useMemo(() => brands.filter(b => b.isOwner), [brands]);
  const otherBrands = useMemo(() => {
    const myRaw = myBrand ? Address.parse(myBrand).toRawString() : '';
    return brands.filter(b => b.address.toRawString() !== myRaw);
  }, [brands, myBrand]);

  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  const loadInbox = useCallback(async () => {
    if (!contractService || myBrands.length === 0 || loadingRef.current) return;
    loadingRef.current = true;
    setInboxLoading(true);
    try {
      const entries: InboxEntry[] = [];
      await Promise.all(myBrands.map(async (myB) => {
        const proposals = await contractService.getIncomingProposals(myB.address);
        for (const [proposerAddr, storedRate] of proposals) {
          const proposer = brands.find(b =>
            b.address.toString({ urlSafe: true, bounceable: true }) === proposerAddr ||
            b.address.toRawString() === proposerAddr
          );
          entries.push({
            proposerAddress: proposerAddr,
            proposerName: proposer?.name ?? proposerAddr.slice(0, 8) + '…',
            proposerSymbol: proposer?.symbol ?? '???',
            myBrandAddress: myB.address.toString({ urlSafe: true, bounceable: true }),
            myBrandName: myB.name,
            myBrandSymbol: myB.symbol,
            rate: storedRate,
          });
        }
      }));
      setInbox(entries);
    } finally {
      loadingRef.current = false;
      setInboxLoading(false);
    }
  }, [contractService, myBrands, brands]);

  useEffect(() => {
    if (connected && myBrands.length > 0 && !loadedRef.current) {
      loadedRef.current = true;
      loadInbox();
    }
    if (!connected) loadedRef.current = false;
  }, [connected, myBrands.length > 0]);

  const handleSetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService) return;

    if (!rate || Number(rate) <= 0) {
      toast.error('Укажите курс больше 0');
      return;
    }

    const myRaw = Address.parse(myBrand).toRawString();
    const targetRaw = Address.parse(targetBrand).toRawString();
    if (myRaw === targetRaw) {
      toast.error('Нельзя установить курс для того же токена');
      return;
    }

    setLoading(true);
    try {
      const myBrandAddress = Address.parse(myBrand);
      const targetBrandAddress = Address.parse(targetBrand);
      const rateScaled = BigInt(Math.round(Number(rate) * 1000));
      const targetOwned = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === targetBrand && b.isOwner);
      const messages: { address: string; amount: string; payload: string }[] = [];

      if (targetOwned) {
        const reverseRateScaled = rateScaled > 0n ? BigInt(Math.round(1000000 / Number(rateScaled))) : 0n;
        messages.push(
          contractService.buildSetExchangeRatePayload({
            brandAddress: myBrandAddress,
            jettonMasterAddress: targetBrandAddress,
            rate: rateScaled,
          }),
          contractService.buildSetExchangeRatePayload({
            brandAddress: targetBrandAddress,
            jettonMasterAddress: myBrandAddress,
            rate: reverseRateScaled,
          }),
          contractService.buildAcceptRatePayload({
            brandAddress: targetBrandAddress,
            sourceBrand: myBrandAddress,
          }),
          contractService.buildAcceptRatePayload({
            brandAddress: myBrandAddress,
            sourceBrand: targetBrandAddress,
          }),
        );
      } else {
        messages.push(
          contractService.buildSetExchangeRatePayload({
            brandAddress: myBrandAddress,
            jettonMasterAddress: targetBrandAddress,
            rate: rateScaled,
          }),
        );
      }

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages,
      });

      toast.success(
        targetOwned
          ? 'Курс установлен в обоих направлениях — обмен активен!'
          : 'Курс предложен. Ожидаем подтверждения от владельца бренда.'
      );
      setRate('');
      setTimeout(loadInbox, 4000);
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

  const handleAccept = async (entry: InboxEntry) => {
    if (!contractService) return;
    try {
      const msg = contractService.buildAcceptRatePayload({
        brandAddress: Address.parse(entry.myBrandAddress),
        sourceBrand: Address.parse(entry.proposerAddress),
      });
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });
      toast.success('Курс принят — обмен активен!');
      setTimeout(loadInbox, 4000);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('Interrupted') || msg.includes('cancel')) {
        toast('Отменено', { icon: '✕' });
      } else {
        toast.error('Ошибка: ' + msg);
      }
    }
  };

  const handleReject = async (entry: InboxEntry) => {
    if (!contractService) return;
    try {
      const msg = contractService.buildRejectProposalPayload({
        brandAddress: Address.parse(entry.myBrandAddress),
        proposerBrand: Address.parse(entry.proposerAddress),
      });
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });
      toast.success('Предложение отклонено');
      setTimeout(loadInbox, 4000);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('Interrupted') || msg.includes('cancel')) {
        toast('Отменено', { icon: '✕' });
      } else {
        toast.error('Ошибка: ' + msg);
      }
    }
  };

  const handleCounter = (entry: InboxEntry) => {
    setMyBrand(entry.myBrandAddress);
    setTargetBrand(entry.proposerAddress);
    setRate('');
    toast('Заполните встречный курс ниже', { icon: '↕️' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      
      {myBrands.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Входящие предложения</h3>
            <button
              onClick={loadInbox}
              disabled={inboxLoading}
              className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          {inboxLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-16 w-full" />
            </div>
          ) : inbox.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-3">Нет входящих предложений</p>
          ) : (
            <div className="space-y-2">
              {inbox.map((entry, i) => (
                <div key={i} className="bg-blue-50/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {entry.proposerName} ({entry.proposerSymbol})
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        1 {entry.proposerSymbol} → {(entry.rate / 1000).toFixed(3).replace(/\.?0+$/, '')} {entry.myBrandSymbol}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">для бренда {entry.myBrandName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(entry)}
                      className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => handleReject(entry)}
                      className="flex-1 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                    >
                      Отклонить
                    </button>
                    <button
                      onClick={() => handleCounter(entry)}
                      className="flex-1 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-200 transition-colors"
                    >
                      Встречное
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {myBrands.length === 0 ? (
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
                onChange={(e) => { setMyBrand(e.target.value); if (e.target.value === targetBrand) setTargetBrand(''); }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              >
                <option value="">Выберите свой бренд</option>
                {myBrands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString({ urlSafe: true, bounceable: true })}>
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
                  <option key={b.address.toString()} value={b.address.toString({ urlSafe: true, bounceable: true })}>
                    {b.name} ({b.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Курс (сколько принимаемых токенов за 1 ваш)
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
                1 {myBrands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === myBrand)?.symbol || '???'} ={' '}
                {rate} {otherBrands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === targetBrand)?.symbol || '???'}
              </p>
              <p className="text-blue-500">
                {brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === targetBrand && b.isOwner)
                  ? 'Курс будет установлен в обоих направлениях'
                  : 'Предложение будет отправлено владельцу бренда для подтверждения'}
              </p>
            </div>
          )}

          <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-600">
            <p>Газ: ~0.07 TON (включает доставку предложения)</p>
          </div>

          <button
            type="submit"
            disabled={loading || !myBrand || !targetBrand}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка...' : 'Предложить курс'}
          </button>
        </form>
      )}
    </div>
  );
}
