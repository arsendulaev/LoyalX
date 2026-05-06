import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useBrands } from '../hooks/useBrands';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import toast from 'react-hot-toast';
import { notifyEvent } from '../services/notificationService';
import { handleTxError } from '../utils/toastError';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: "easeOut" as const } },
  },
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.15em',
  color: 'rgba(224,224,224,0.35)',
  marginBottom: 6,
};

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
    if (!fromBrand || !contractService) { setActivePairs([]); return; }
    const myReqId = ++requestIdRef.current;
    const fromAddr = Address.parse(fromBrand);
    const fromRaw = fromAddr.toRawString();
    const others = brands.filter(b => b.address.toRawString() !== fromRaw).map(b => b.address);
    if (others.length === 0) { setActivePairs([]); return; }
    setPairsLoading(true);
    contractService.getActivePairs(fromAddr, others).then(pairs => {
      if (requestIdRef.current !== myReqId) return;
      setActivePairs(pairs.map(p => {
        const info = brands.find(b => b.address.toRawString() === p.brand.toRawString());
        return { brandAddr: p.brand.toString({ urlSafe: true, bounceable: true }), symbol: info?.symbol ?? '???', name: info?.name ?? p.brand.toString().slice(0, 8) + '…', rate: p.rate };
      }));
    }).finally(() => { if (requestIdRef.current === myReqId) setPairsLoading(false); });
  }, [fromBrand, contractService, brands]);

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !contractService) return;
    if (fromBrand === toBrand) { toast.error('Нельзя обменять токен на тот же'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Укажите количество'); return; }
    const pair = activePairs.find(p => p.brandAddr === toBrand);
    if (!pair) { toast.error('Нет курса для этой пары'); return; }
    setLoading(true);
    try {
      const msg = await contractService.buildSwapPayload({
        fromBrandAddress: Address.parse(fromBrand),
        toBrandAddress: Address.parse(toBrand),
        amount: toNano(amount),
        userAddress: address!,
      });
      await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, network: '-3', messages: [msg] });
      toast.success('Обмен отправлен! Ожидайте подтверждения.');
      const fromInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === fromBrand);
      notifyEvent('swap', { fromSymbol: fromInfo?.symbol ?? '', toSymbol: pair.symbol, amount });
      setAmount('');
    } catch (error) {
      handleTxError(error);
    } finally {
      setLoading(false);
    }
  };

  const fromBrandInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === fromBrand);
  const toBrandInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === toBrand);
  const selectedPair = activePairs.find(p => p.brandAddr === toBrand);

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
          // Подключите кошелёк для обмена токенов
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={stagger.item} className="flex items-end justify-between">
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '0.05em', color: '#E0E0E0' }}>
          ОБМЕН
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(46,91,255,0.7)', letterSpacing: '0.1em' }}>
          ОБМЕН ТОКЕНАМИ
        </span>
      </motion.div>

      {brands.length < 2 ? (
        <motion.div variants={stagger.item} className="brand-card rounded-sm p-6">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
            // Нужно минимум 2 бренда для обмена
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.2)', marginTop: 4 }}>
            // Создано: {brands.length}
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSwap} className="space-y-3">
          <motion.div variants={stagger.item} className="brand-card rounded-sm p-4 space-y-4">
            <div>
              <label style={labelStyle}>ОТДАЮ</label>
              <select
                value={fromBrand}
                onChange={(e) => { setFromBrand(e.target.value); setToBrand(''); }}
                className="input-industrial w-full px-3 py-2.5 rounded-sm"
                required
              >
                <option value="">ВЫБЕРИТЕ ТОКЕН</option>
                {brands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString({ urlSafe: true, bounceable: true })}>
                    {b.name} [{b.symbol}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '0.5px solid rgba(46,91,255,0.3)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(46,91,255,0.05)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E5BFF" strokeWidth="1.5" strokeLinecap="square">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>

            {fromBrand && (
              <div>
                <label style={labelStyle}>
                  ДОСТУПНЫЕ ПАРЫ
                  {pairsLoading && <span style={{ marginLeft: 8, color: '#2E5BFF' }} className="animate-pulse">ЗАГРУЗКА...</span>}
                </label>
                {!pairsLoading && activePairs.length === 0 ? (
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.25)' }}>
                    // Нет активных курсов для этого токена
                  </p>
                ) : (
                  <div className="space-y-1">
                    {activePairs.map(pair => (
                      <button
                        key={pair.brandAddr}
                        type="button"
                        onClick={() => setToBrand(pair.brandAddr)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: toBrand === pair.brandAddr ? 'rgba(46,91,255,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `0.5px solid ${toBrand === pair.brandAddr ? 'rgba(46,91,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 11, color: toBrand === pair.brandAddr ? '#2E5BFF' : '#E0E0E0' }}>
                          {fromBrandInfo?.symbol ?? '?'} → {pair.symbol}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.4)' }}>
                          1:{(pair.rate / 1000).toFixed(3).replace(/\.?0+$/, '')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={labelStyle}>КОЛИЧЕСТВО</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-industrial w-full px-3 py-2.5 rounded-sm"
                placeholder="100"
                min="0"
                step="0.01"
                required
              />
            </div>

            {toBrandInfo && (
              <div>
                <label style={labelStyle}>ПОЛУЧАЮ</label>
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(46,91,255,0.06)',
                    border: '0.5px solid rgba(46,91,255,0.2)',
                    borderRadius: 2,
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#2E5BFF',
                  }}
                >
                  {toBrandInfo.name} [{toBrandInfo.symbol}]
                </div>
              </div>
            )}

            {fromBrandInfo && toBrandInfo && amount && selectedPair && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.05)',
                borderRadius: 2,
              }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.5)' }}>
                  {amount} {fromBrandInfo.symbol} ≈{' '}
                  <span style={{ color: '#2E5BFF', fontWeight: 600 }}>
                    {(Number(amount) * (selectedPair.rate / 1000)).toLocaleString('ru', { maximumFractionDigits: 4 })} {toBrandInfo.symbol}
                  </span>
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.25)', marginTop: 4 }}>
                  ГАЗ ~0.5 TON
                </p>
              </div>
            )}
          </motion.div>

          <motion.button
            variants={stagger.item}
            type="submit"
            disabled={loading || !fromBrand || !toBrand || !activePairs.some(p => p.brandAddr === toBrand)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || !fromBrand || !toBrand ? 'rgba(255,255,255,0.03)' : '#2E5BFF',
              border: `0.5px solid ${loading || !fromBrand || !toBrand ? 'rgba(255,255,255,0.06)' : 'rgba(46,91,255,0.5)'}`,
              borderRadius: 2,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.15em',
              color: loading || !fromBrand || !toBrand ? 'rgba(224,224,224,0.2)' : '#fff',
              boxShadow: (!loading && fromBrand && toBrand) ? '0 0 30px rgba(46,91,255,0.25)' : 'none',
              cursor: loading || !fromBrand || !toBrand ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'ОТПРАВКА...' : 'ВЫПОЛНИТЬ ОБМЕН'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}
