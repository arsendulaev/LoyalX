import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTonConnect } from '../hooks/useTonConnect';
import { getTransactionHistory, Transaction, TxType } from '../services/tonApiService';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  },
};

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
      setError(e?.message ?? 'Load error');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
          // Подключите кошелёк для просмотра истории
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '0.05em', color: '#E0E0E0' }}>
          ЖУРНАЛ
        </span>
        <button
          onClick={load}
          disabled={loading}
          style={{ color: 'rgba(224,224,224,0.4)' }}
        >
          <svg className={loading ? 'animate-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-sm" />
          ))}
        </div>
      ) : error ? (
        <motion.div variants={stagger.item} className="py-8">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ff4444' }}>{error}</p>
          <button onClick={load} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2E5BFF', marginTop: 8 }}>
            ПОВТОРИТЬ →
          </button>
        </motion.div>
      ) : txs.length === 0 ? (
        <motion.div variants={stagger.item} className="py-12">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
            // Транзакций нет
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1.5">
          {txs.map((tx, idx) => (
            <motion.button
              key={tx.id}
              variants={stagger.item}
              custom={idx}
              onClick={() => window.open(tx.explorerUrl, '_blank')}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
              className="w-full text-left flex items-center gap-3 p-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.05)',
                borderRadius: 2,
                transition: 'border-color 0.15s',
              }}
            >
              <TxBadge type={tx.type} sign={tx.sign} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 12, color: '#E0E0E0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.tokenName}
                  {tx.tokenSymbol && tx.tokenSymbol !== tx.tokenName && (
                    <span style={{ color: 'rgba(224,224,224,0.35)', fontWeight: 400, marginLeft: 6, fontSize: 10 }}>[{tx.tokenSymbol}]</span>
                  )}
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.3)', marginTop: 2 }}>
                  {tx.date}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: tx.sign === '+' ? '#22c55e' : '#E0E0E0' }}>
                  {tx.sign}{tx.amount}
                </p>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 8,
                  letterSpacing: '0.1em',
                  color: tx.status === 'success' ? 'rgba(34,197,94,0.7)' : 'rgba(255,68,68,0.7)',
                }}>
                  {tx.status === 'success' ? 'ОК' : 'ОШИБКА'}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const txTypeLabels: Record<TxType, string> = {
  Mint: 'MNT',
  Burn: 'BRN',
  Swap: 'SWP',
  Transfer: 'TRF',
};

function TxBadge({ type, sign }: { type: TxType; sign: '+' | '-' }) {
  const isIncoming = sign === '+';
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 2,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isIncoming ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
        border: `0.5px solid ${isIncoming ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.05em',
        color: isIncoming ? '#22c55e' : 'rgba(224,224,224,0.5)',
        fontWeight: 600,
      }}>
        {txTypeLabels[type]}
      </span>
    </div>
  );
}
