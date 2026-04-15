import { useState, useEffect, useCallback } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { getTransactionHistory, Transaction, TxType } from '../services/tonApiService';

export function TransactionHistoryScreen() {
  const { address, connected } = useTonConnect();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactionHistory(address.toString());
      setTxs(data);
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 text-sm">Подключите кошелёк, чтобы видеть историю</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">История транзакций</h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          title="Обновить"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button onClick={load} className="text-indigo-600 text-sm underline">Повторить</button>
        </div>
      ) : txs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">Транзакций нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map((tx) => (
            <button
              key={tx.id}
              onClick={() => window.open(tx.explorerUrl, '_blank')}
              className="w-full text-left bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              <TxIcon type={tx.type} sign={tx.sign} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {tx.tokenName}
                  {tx.tokenSymbol && tx.tokenSymbol !== tx.tokenName && (
                    <span className="text-gray-400 ml-1 font-normal">{tx.tokenSymbol}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{tx.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${tx.sign === '+' ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {tx.sign}{tx.amount}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                }`}>
                  {tx.status === 'success' ? 'ok' : 'fail'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TxIcon({ type, sign }: { type: TxType; sign: '+' | '-' }) {
  const color = sign === '+' ? '#10b981' : '#6b7280';
  const bg = sign === '+' ? 'bg-emerald-50' : 'bg-gray-100';

  const icons: Record<TxType, JSX.Element> = {
    Mint: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    Burn: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13H7l5-8 5 8z" />
      </svg>
    ),
    Swap: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    Transfer: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  };

  return (
    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
      {icons[type]}
    </div>
  );
}
