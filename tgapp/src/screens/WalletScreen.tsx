import { useState } from 'react';
import { useTonConnect } from '../hooks/useTonConnect';
import { useBrands } from '../hooks/useBrands';
import { EarnScanner } from '../components/EarnScanner';
import { QRCodeSVG } from 'qrcode.react';

const PAGE_SIZE = 10;

export function WalletScreen() {
  const { address, connected } = useTonConnect();
  const { balances, loading, polling, error, reload } = useBrands();
  const [scanOpen, setScanOpen] = useState(false);
  const [showAddressQR, setShowAddressQR] = useState(false);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(balances.length / PAGE_SIZE);
  const pagedBalances = balances.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">LoyalX</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Подключите кошелёк TON чтобы начать работу с системой лояльности
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scanOpen && <EarnScanner onClose={() => setScanOpen(false)} />}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs text-gray-400">Мой кошелёк</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddressQR(v => !v)}
              className="text-indigo-600 hover:text-indigo-700"
              title="Показать QR адреса"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>
              </svg>
            </button>
            <button
              onClick={() => { setPage(0); reload(true); }}
              disabled={loading}
              className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              title="Обновить"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">
          {address?.toString()}
        </p>
        {showAddressQR && address && (
          <div className="flex flex-col items-center pt-3 mt-3 border-t border-gray-100 gap-2">
            <QRCodeSVG value={address.toString()} size={160} />
            <p className="text-xs text-gray-400">Покажите этот QR кассиру для начисления баллов</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setScanOpen(true)}
        className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-base rounded-2xl py-4 shadow-md transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM17 17h3v3h-3z" />
        </svg>
        Оплатить баллами (сканировать QR)
      </button>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Все бренды</h3>
          {polling && !loading && (
            <span className="text-xs text-indigo-500 animate-pulse">Ищем новые токены…</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => reload(true)} className="mt-2 text-indigo-600 text-xs underline">Повторить</button>
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Брендов нет</p>
            <p className="text-gray-300 text-xs mt-1">Создайте первый бренд</p>
          </div>
        ) : (
          <>
          <div className="space-y-2">
            {pagedBalances.map(({ brand, balance, meta }) => {
              const isZero = balance === 0n;
              const isUnknown = meta.symbol === '???';
              return (
                <div
                  key={brand.toString()}
                  className={`flex items-center justify-between p-3 rounded-xl ${isZero || isUnknown ? 'bg-gray-50/50 opacity-70' : 'bg-gray-50/80'}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isZero || isUnknown ? 'text-gray-500' : 'text-gray-800'}`}>
                      {meta.name}
                      {isZero && !isUnknown && <span className="ml-1 text-xs text-gray-400">(нет токенов)</span>}
                      {isUnknown && <span className="ml-1 text-xs text-gray-400">(загрузка…)</span>}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {brand.toString().slice(0, 8)}…{brand.toString().slice(-4)}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className={`text-base font-bold ${isZero || isUnknown ? 'text-gray-400' : 'text-indigo-600'}`}>
                      {(Number(balance) / 1e9).toLocaleString('ru', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">{meta.symbol}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 disabled:text-gray-300 bg-indigo-50 disabled:bg-gray-50 rounded-lg transition-colors"
              >
                ← Назад
              </button>
              <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 disabled:text-gray-300 bg-indigo-50 disabled:bg-gray-50 rounded-lg transition-colors"
              >
                Вперёд →
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
