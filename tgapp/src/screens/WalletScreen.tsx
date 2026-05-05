import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnect } from '../hooks/useTonConnect';
import { useBrands } from '../hooks/useBrands';
import { EarnScanner } from '../components/EarnScanner';
import { QRCodeSVG } from 'qrcode.react';

const PAGE_SIZE = 10;

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  },
  item: {
    hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: "easeOut" as const } },
  },
};

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
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="flex flex-col items-start justify-center py-16"
      >
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, letterSpacing: '0.2em', color: 'rgba(224,224,224,0.3)', marginBottom: 16 }}>
          ТРЕБУЕТСЯ ПОДКЛЮЧЕНИЕ
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, lineHeight: 1.1, color: '#E0E0E0', marginBottom: 8 }}>
          ПОДКЛЮЧИТЕ<br />
          <span style={{ color: '#2E5BFF' }}>КОШЕЛЁК</span>
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.4)', marginTop: 12, lineHeight: 1.6 }}>
          // Чтобы получить доступ к LoyalX<br />
          // требуется TON кошелёк
        </p>
        <div style={{ width: 40, height: 0.5, background: 'rgba(46,91,255,0.5)', marginTop: 24 }} />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {scanOpen && <EarnScanner onClose={() => setScanOpen(false)} />}

      <motion.div variants={stagger.item} className="brand-card rounded-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(224,224,224,0.3)' }}>
            АДРЕС КОШЕЛЬКА
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddressQR(v => !v)}
              style={{ color: showAddressQR ? '#2E5BFF' : 'rgba(224,224,224,0.4)', transition: 'color 0.15s' }}
              title="QR адреса"
            >
              <QRIcon />
            </button>
            <button
              onClick={() => { setPage(0); reload(true); }}
              disabled={loading}
              style={{ color: 'rgba(224,224,224,0.4)', transition: 'color 0.15s' }}
            >
              <svg className={loading ? 'animate-spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#E0E0E0', wordBreak: 'break-all', lineHeight: 1.7 }}>
          {address?.toString()}
        </p>

        <AnimatePresence>
          {showAddressQR && address && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col items-center pt-4 mt-4 gap-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ padding: 16, background: '#fff', borderRadius: 2 }}>
                  <QRCodeSVG value={address.toString()} size={160} />
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.35)', textAlign: 'center' }}>
                  // Покажите этот QR кассиру для начисления баллов
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        variants={stagger.item}
        onClick={() => setScanOpen(true)}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-3 py-4 relative overflow-hidden"
        style={{
          background: '#2E5BFF',
          border: '0.5px solid rgba(46,91,255,0.5)',
          borderRadius: 2,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.12em',
          color: '#fff',
          boxShadow: '0 0 30px rgba(46,91,255,0.25)',
        }}
      >
        <QRIcon size={18} />
        СКАНИРОВАТЬ QR — ОПЛАТИТЬ БАЛЛАМИ
      </motion.button>

      <motion.div variants={stagger.item} className="brand-card rounded-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', color: '#E0E0E0' }}>
            БРЕНДЫ
          </span>
          {polling && !loading && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2E5BFF', letterSpacing: '0.1em' }} className="animate-pulse">
              ПОИСК...
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : error ? (
          <div className="py-6">
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ff4444' }}>{error}</p>
            <button onClick={() => reload(true)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2E5BFF', marginTop: 8 }}>
              ПОВТОРИТЬ →
            </button>
          </div>
        ) : balances.length === 0 ? (
          <div className="py-8">
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>// Брендов не найдено</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.2)', marginTop: 4 }}>// Создайте первый бренд</p>
          </div>
        ) : (
          <>
            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {pagedBalances.map(({ brand, balance, meta }) => {
                const isZero = balance === 0n;
                const isUnknown = meta.symbol === '???';
                return (
                  <motion.div
                    key={brand.toString()}
                    variants={stagger.item}
                    whileHover={{
                      y: -2,
                      boxShadow: '0 4px 24px rgba(46,91,255,0.12)',
                      borderColor: 'rgba(46,91,255,0.2)',
                    }}
                    className="flex items-center justify-between p-3"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '0.5px solid rgba(255,255,255,0.06)',
                      borderRadius: 2,
                      transition: 'border-color 0.2s',
                      opacity: isZero || isUnknown ? 0.5 : 1,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13, color: '#E0E0E0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meta.name}
                        {isUnknown && <span style={{ fontSize: 10, color: 'rgba(224,224,224,0.3)', marginLeft: 6 }}>ЗАГРУЗКА...</span>}
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.3)', marginTop: 2 }}>
                        {brand.toString().slice(0, 8)}…{brand.toString().slice(-4)}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 16, color: isZero ? 'rgba(224,224,224,0.25)' : '#2E5BFF' }}>
                        {(Number(balance) / 1e9).toLocaleString('ru', { maximumFractionDigits: 2 })}
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.35)', letterSpacing: '0.1em' }}>
                        {meta.symbol}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: page === 0 ? 'rgba(224,224,224,0.2)' : '#2E5BFF', letterSpacing: '0.1em' }}
                >
                  ← НАЗАД
                </button>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.3)' }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: page >= totalPages - 1 ? 'rgba(224,224,224,0.2)' : '#2E5BFF', letterSpacing: '0.1em' }}
                >
                  ВПЕРЁД →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function QRIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      <path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>
    </svg>
  );
}
