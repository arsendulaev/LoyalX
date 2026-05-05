import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Address } from '@ton/core';
import { ContractService } from '../services/contractService';

interface Brand {
  address: Address;
  name: string;
  symbol: string;
}

interface Props {
  brands: Brand[];
  onClose: () => void;
}

export function CheckoutQR({ brands, onClose }: Props) {
  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.address.toString() ?? '');
  const [amount, setAmount] = useState('');

  const qrUrl = (() => {
    if (!selectedBrand || !amount || Number(amount) <= 0) return null;
    if (!ContractService.isValidAddress(selectedBrand)) return null;
    const nanos = BigInt(Math.round(Number(amount) * 1e9));
    return `ton://transfer/${selectedBrand}?amount=${nanos}&text=earn`;
  })();

  const selectedMeta = brands.find(b => b.address.toString() === selectedBrand);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md p-6 space-y-5"
          style={{
            background: '#0F0F0F',
            borderTop: '0.5px solid rgba(255,255,255,0.08)',
            borderLeft: '0.5px solid rgba(255,255,255,0.06)',
            borderRight: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: '2px 2px 0 0',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', color: '#E0E0E0' }}>
              QR ДЛЯ КАССЫ
            </span>
            <button
              onClick={onClose}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.4)', letterSpacing: '0.1em' }}
            >
              [ESC]
            </button>
          </div>

          <div>
            <label style={labelStyle}>БРЕНД</label>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="input-industrial w-full px-3 py-2.5 rounded-sm"
            >
              {brands.map(b => (
                <option key={b.address.toString()} value={b.address.toString()}>
                  {b.name} [{b.symbol}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>КОЛ-ВО_К_СПИСАНИЮ</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input-industrial w-full px-3 py-2.5 rounded-sm"
              placeholder="10"
              min="0.01"
              step="0.01"
            />
            {selectedMeta && amount && Number(amount) > 0 && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.3)', marginTop: 4 }}>
                // Клиент спишет {amount} {selectedMeta.symbol}
              </p>
            )}
          </div>

          {qrUrl ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div
                style={{
                  padding: 16,
                  background: '#fff',
                  borderRadius: 2,
                  boxShadow: '0 0 40px rgba(46,91,255,0.15)',
                }}
              >
                <QRCodeSVG value={qrUrl} size={188} />
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.25)', textAlign: 'center', wordBreak: 'break-all', padding: '0 8px' }}>
                {qrUrl}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2E5BFF', textAlign: 'center', letterSpacing: '0.05em' }}>
                // Покажите клиенту — он сканирует приложением LoyalX
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                height: 200,
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.2)' }}>
                // Введите сумму для генерации QR
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
