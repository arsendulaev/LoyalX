import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useBrands } from '../hooks/useBrands';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import toast from 'react-hot-toast';
import { notifyEvent } from '../services/notificationService';
import { handleTxError } from '../utils/toastError';

interface InboxEntry {
  proposerAddress: string;
  proposerName: string;
  proposerSymbol: string;
  myBrandAddress: string;
  myBrandName: string;
  myBrandSymbol: string;
  rate: number;
}

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
  }, [connected, myBrands.length]);

  const handleSetRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService) return;
    if (!rate || Number(rate) <= 0) { toast.error('Укажите курс больше 0'); return; }
    const myRaw = Address.parse(myBrand).toRawString();
    const targetRaw = Address.parse(targetBrand).toRawString();
    if (myRaw === targetRaw) { toast.error('Нельзя установить курс для того же токена'); return; }
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
          contractService.buildSetExchangeRatePayload({ brandAddress: myBrandAddress, jettonMasterAddress: targetBrandAddress, rate: rateScaled }),
          contractService.buildSetExchangeRatePayload({ brandAddress: targetBrandAddress, jettonMasterAddress: myBrandAddress, rate: reverseRateScaled }),
          contractService.buildAcceptRatePayload({ brandAddress: targetBrandAddress, sourceBrand: myBrandAddress }),
          contractService.buildAcceptRatePayload({ brandAddress: myBrandAddress, sourceBrand: targetBrandAddress }),
        );
      } else {
        messages.push(contractService.buildSetExchangeRatePayload({ brandAddress: myBrandAddress, jettonMasterAddress: targetBrandAddress, rate: rateScaled }));
      }
      await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, network: '-3', messages });
      toast.success(targetOwned ? 'Rate set both ways — swap active!' : 'Предложение отправлено. Ожидаем подтверждения владельца.');
      const targetInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === targetBrand);
      notifyEvent('rate_proposed', { targetSymbol: targetInfo?.symbol ?? targetBrand });
      setRate('');
      setTimeout(loadInbox, 4000);
    } catch (error) {
      handleTxError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (entry: InboxEntry) => {
    if (!contractService) return;
    try {
      const msg = contractService.buildAcceptRatePayload({ brandAddress: Address.parse(entry.myBrandAddress), sourceBrand: Address.parse(entry.proposerAddress) });
      await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, network: '-3', messages: [msg] });
      toast.success('Курс принят — обмен активен!');
      setTimeout(loadInbox, 4000);
    } catch (error) { handleTxError(error); }
  };

  const handleReject = async (entry: InboxEntry) => {
    if (!contractService) return;
    try {
      const msg = contractService.buildRejectProposalPayload({ brandAddress: Address.parse(entry.myBrandAddress), proposerBrand: Address.parse(entry.proposerAddress) });
      await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, network: '-3', messages: [msg] });
      toast.success('Предложение отклонено');
      setTimeout(loadInbox, 4000);
    } catch (error) { handleTxError(error); }
  };

  const handleCounter = (entry: InboxEntry) => {
    setMyBrand(entry.myBrandAddress);
    setTargetBrand(entry.proposerAddress);
    setRate('');
    toast('Заполните встречный курс ниже', { icon: '↕️' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const myBrandInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === myBrand);
  const targetBrandInfo = brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === targetBrand);
  const bothOwned = !!brands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === targetBrand && b.isOwner);

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
          // Подключите кошелёк для настройки курсов
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={stagger.item} className="flex items-end justify-between">
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '0.05em', color: '#E0E0E0' }}>
          КУРСЫ
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(46,91,255,0.7)', letterSpacing: '0.1em' }}>
          НАСТРОЙКА КУРСОВ
        </span>
      </motion.div>

      {myBrands.length > 0 && (
        <motion.div variants={stagger.item} className="brand-card rounded-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', color: '#E0E0E0' }}>
              ВХОДЯЩИЕ
            </span>
            <button
              onClick={loadInbox}
              disabled={inboxLoading}
              style={{ color: 'rgba(224,224,224,0.4)' }}
            >
              <svg className={inboxLoading ? 'animate-spin' : ''} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          {inboxLoading ? (
            <div className="skeleton h-14 w-full" />
          ) : inbox.length === 0 ? (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.25)', textAlign: 'center', padding: '8px 0' }}>
              // Нет входящих предложений
            </p>
          ) : (
            <div className="space-y-2">
              {inbox.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(46,91,255,0.05)',
                    border: '0.5px solid rgba(46,91,255,0.15)',
                    borderRadius: 2,
                  }}
                >
                  <div className="mb-2">
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 12, color: '#E0E0E0' }}>
                      {entry.proposerName} [{entry.proposerSymbol}]
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2E5BFF', marginTop: 2 }}>
                      1 {entry.proposerSymbol} → {(entry.rate / 1000).toFixed(3).replace(/\.?0+$/, '')} {entry.myBrandSymbol}
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.3)', marginTop: 1 }}>
                      for {entry.myBrandName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {['ПРИНЯТЬ', 'ОТКЛОНИТЬ', 'ВСТРЕЧНОЕ'].map((label) => (
                      <button
                        key={label}
                        onClick={() => label === 'ПРИНЯТЬ' ? handleAccept(entry) : label === 'ОТКЛОНИТЬ' ? handleReject(entry) : handleCounter(entry)}
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          background: label === 'ПРИНЯТЬ' ? 'rgba(34,197,94,0.1)' : label === 'ОТКЛОНИТЬ' ? 'rgba(255,68,68,0.1)' : 'rgba(46,91,255,0.1)',
                          border: `0.5px solid ${label === 'ПРИНЯТЬ' ? 'rgba(34,197,94,0.3)' : label === 'ОТКЛОНИТЬ' ? 'rgba(255,68,68,0.3)' : 'rgba(46,91,255,0.3)'}`,
                          borderRadius: 2,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          letterSpacing: '0.08em',
                          color: label === 'ПРИНЯТЬ' ? '#22c55e' : label === 'ОТКЛОНИТЬ' ? '#ff4444' : '#2E5BFF',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {myBrands.length === 0 ? (
        <motion.div variants={stagger.item} className="brand-card rounded-sm p-6">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
            // Нет ваших брендов
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.2)', marginTop: 4 }}>
            // Создайте бренд для настройки курсов
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSetRate} className="space-y-3">
          <motion.div variants={stagger.item} className="brand-card rounded-sm p-4 space-y-4">
            <div>
              <label style={labelStyle}>МОЙ ТОКЕН</label>
              <select
                value={myBrand}
                onChange={(e) => { setMyBrand(e.target.value); if (e.target.value === targetBrand) setTargetBrand(''); }}
                className="input-industrial w-full px-3 py-2.5 rounded-sm"
                required
              >
                <option value="">ВЫБЕРИТЕ СВОЙ БРЕНД</option>
                {myBrands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString({ urlSafe: true, bounceable: true })}>
                    {b.name} [{b.symbol}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>ВХОДЯЩИЙ ТОКЕН</label>
              <select
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                className="input-industrial w-full px-3 py-2.5 rounded-sm"
                required
              >
                <option value="">ВЫБЕРИТЕ ВХОДЯЩИЙ ТОКЕН</option>
                {otherBrands.map((b) => (
                  <option key={b.address.toString()} value={b.address.toString({ urlSafe: true, bounceable: true })}>
                    {b.name} [{b.symbol}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                КУРС <span style={{ color: 'rgba(224,224,224,0.2)' }}>// входящих токенов за 1 ваш</span>
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="input-industrial w-full px-3 py-2.5 rounded-sm"
                placeholder="1.5"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            {myBrandInfo && targetBrandInfo && rate && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(46,91,255,0.05)',
                border: '0.5px solid rgba(46,91,255,0.15)',
                borderRadius: 2,
              }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.6)' }}>
                  1 {myBrandInfo.symbol} = {rate} {targetBrandInfo.symbol}
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: bothOwned ? '#22c55e' : 'rgba(224,224,224,0.3)', marginTop: 4 }}>
                  {bothOwned ? '// Курс сразу будет задан в обоих направлениях' : '// Предложение будет отправлено владельцу бренда'}
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.25)', marginTop: 2 }}>
                  ГАЗ ~0.07 TON
                </p>
              </div>
            )}
          </motion.div>

          <motion.button
            variants={stagger.item}
            type="submit"
            disabled={loading || !myBrand || !targetBrand}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || !myBrand || !targetBrand ? 'rgba(255,255,255,0.03)' : '#2E5BFF',
              border: `0.5px solid ${loading || !myBrand || !targetBrand ? 'rgba(255,255,255,0.06)' : 'rgba(46,91,255,0.5)'}`,
              borderRadius: 2,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.15em',
              color: loading || !myBrand || !targetBrand ? 'rgba(224,224,224,0.2)' : '#fff',
              boxShadow: (!loading && myBrand && targetBrand) ? '0 0 30px rgba(46,91,255,0.25)' : 'none',
              cursor: loading || !myBrand || !targetBrand ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'ОТПРАВКА...' : 'ПРЕДЛОЖИТЬ КУРС'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}
