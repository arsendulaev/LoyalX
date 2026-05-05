import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useBrands } from '../hooks/useBrands';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import { ContractService } from '../services/contractService';
import { CheckoutQR } from '../components/CheckoutQR';
import { Scanner } from '@yudiel/react-qr-scanner';
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

function ChargeButton({ onFired, disabled }: { onFired: () => void; disabled: boolean }) {
  const [charging, setCharging] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  const startCharge = useCallback(() => {
    if (disabled) return;
    firedRef.current = false;
    setCharging(true);
    setProgress(0);
    const start = Date.now();
    const duration = 1500;
    intervalRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      if (p >= 1 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(intervalRef.current!);
        setCharging(false);
        setProgress(0);
        onFired();
      }
    }, 16);
  }, [disabled, onFired]);

  const cancelCharge = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCharging(false);
    setProgress(0);
  }, []);

  return (
    <motion.button
      type="button"
      onPointerDown={startCharge}
      onPointerUp={cancelCharge}
      onPointerLeave={cancelCharge}
      disabled={disabled}
      className="w-full py-4 relative overflow-hidden select-none"
      style={{
        background: 'transparent',
        border: '0.5px solid rgba(46,91,255,0.4)',
        borderRadius: 2,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '0.15em',
        color: disabled ? 'rgba(224,224,224,0.2)' : '#E0E0E0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderColor: disabled ? 'rgba(255,255,255,0.08)' : charging ? 'rgba(46,91,255,0.7)' : 'rgba(46,91,255,0.4)',
        boxShadow: charging ? `0 0 ${20 + progress * 30}px rgba(46,91,255,${0.15 + progress * 0.25})` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.1s',
      }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, rgba(46,91,255,0.2), rgba(46,91,255,0.35))',
          transition: 'none',
          borderRight: progress > 0 ? '1px solid rgba(46,91,255,0.6)' : 'none',
        }}
      />
      <span className="relative z-10">
        {disabled
          ? 'СНАЧАЛА ВЫБЕРИТЕ БРЕНД'
          : charging
          ? `ЗАРЯДКА ${Math.round(progress * 100)}%`
          : 'ЗАЖАТЬ ДЛЯ МИНТА'}
      </span>
    </motion.button>
  );
}

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

  const handleMint = async () => {
    if (!contractService) return;
    if (!ContractService.isValidAddress(recipient)) { toast.error('Некорректный адрес получателя'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Укажите количество токенов'); return; }

    setLoading(true);
    try {
      const msg = contractService.buildMintPayload({
        brandAddress: Address.parse(selectedBrand),
        to: Address.parse(ContractService.toBounceable(recipient)),
        amount: toNano(amount),
      });
      await tonConnectUI.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 300, messages: [msg] });
      toast.success('Токены начислены!');
      const brand = ownedBrands.find(b => b.address.toString({ urlSafe: true, bounceable: true }) === selectedBrand);
      notifyEvent('mint', { symbol: brand?.symbol ?? selectedBrand });
      setRecipient('');
      setAmount('');
    } catch (error) {
      handleTxError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
          // Подключите кошелёк для начисления токенов
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-4">
      {checkoutOpen && (
        <CheckoutQR
          brands={ownedBrands.map(b => ({ address: b.address, name: b.name, symbol: b.symbol }))}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      <AnimatePresence>
        {scanOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#000' }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', color: '#E0E0E0' }}>
                СКАНИРОВАТЬ QR КЛИЕНТА
              </span>
              <button
                onClick={() => setScanOpen(false)}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.5)', letterSpacing: '0.1em' }}
              >
                [ESC]
              </button>
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
                    toast.error('Не удалось распознать QR');
                  }
                }}
                onError={() => toast.error('Camera access denied')}
                constraints={{ facingMode: 'environment' }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  style={{
                    width: 220,
                    height: 220,
                    border: '0.5px solid rgba(46,91,255,0.7)',
                    boxShadow: '0 0 40px rgba(46,91,255,0.15), inset 0 0 40px rgba(46,91,255,0.05)',
                  }}
                />
              </div>
            </div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.3)', textAlign: 'center', padding: '16px' }}>
              // Наведите камеру на QR клиента
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '0.05em', color: '#E0E0E0' }}>
          МИНТ
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(46,91,255,0.7)', letterSpacing: '0.1em' }}>
          ВЫПУСК ТОКЕНА
        </span>
      </motion.div>

      {ownedBrands.length > 0 && (
        <motion.button
          variants={stagger.item}
          onClick={() => setCheckoutOpen(true)}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3"
          style={{
            background: 'rgba(46,91,255,0.08)',
            border: '0.5px solid rgba(46,91,255,0.3)',
            borderRadius: 2,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.15em',
            color: '#2E5BFF',
          }}
        >
          <QRIcon size={16} />
          СГЕНЕРИРОВАТЬ QR ДЛЯ КАССЫ
        </motion.button>
      )}

      {ownedBrands.length === 0 ? (
        <motion.div variants={stagger.item} className="brand-card rounded-sm p-6">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>// Нет ваших брендов</p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.2)', marginTop: 4 }}>// Сначала создайте бренд</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger.item} className="brand-card rounded-sm p-4 space-y-4">
          <div>
            <label style={labelStyle}>БРЕНД</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="input-industrial w-full px-3 py-2.5 rounded-sm"
              required
            >
              <option value="">ВЫБЕРИТЕ БРЕНД</option>
              {ownedBrands.map((b) => (
                <option key={b.address.toString()} value={b.address.toString()}>
                  {b.name} [{b.symbol}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>АДРЕС ПОЛУЧАТЕЛЯ</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="input-industrial flex-1 px-3 py-2.5 rounded-sm"
                placeholder="EQD…"
                required
              />
              <button
                type="button"
                onClick={() => setScanOpen(true)}
                style={{
                  padding: '0 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  color: 'rgba(224,224,224,0.5)',
                }}
              >
                <QRIcon size={14} />
              </button>
              {address && (
                <button
                  type="button"
                  onClick={() => setRecipient(address.toString())}
                  style={{
                    padding: '0 10px',
                    background: 'rgba(46,91,255,0.08)',
                    border: '0.5px solid rgba(46,91,255,0.3)',
                    borderRadius: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    color: '#2E5BFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  СЕБЕ
                </button>
              )}
            </div>
            {recipient && !ContractService.isValidAddress(recipient) && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#ff4444', marginTop: 4 }}>
                // Некорректный адрес
              </p>
            )}
          </div>

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
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.25)', letterSpacing: '0.1em' }}>
              ГАЗ ~0.2 TON
            </span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
          </div>

          <ChargeButton
            onFired={handleMint}
            disabled={loading || !selectedBrand || !recipient || !amount}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.15em',
  color: 'rgba(224,224,224,0.35)',
  marginBottom: 6,
};

function QRIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      <path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>
    </svg>
  );
}
