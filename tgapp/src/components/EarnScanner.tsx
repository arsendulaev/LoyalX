import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Address, beginCell, toNano } from '@ton/core';
import { useTonConnect } from '../hooks/useTonConnect';
import { runGetMethod } from '../services/tonApiService';
import { storeTokenTransfer, TokenTransfer } from '../contracts/JettonWallet';
import toast from 'react-hot-toast';

interface ParsedQR {
  brandAddress: Address;
  amount: bigint;
}

function parseQR(raw: string): ParsedQR | null {
  try {
    if (raw.startsWith('ton://transfer/')) {
      const url = new URL(raw.replace('ton://transfer/', 'https://dummy.host/'));
      const addressPart = url.pathname.replace('/', '');
      const amountParam = url.searchParams.get('amount');
      if (!addressPart || !amountParam) return null;
      return { brandAddress: Address.parse(addressPart), amount: BigInt(amountParam) };
    }
    if (raw.includes(':')) {
      const [addr, amt] = raw.split(':');
      return { brandAddress: Address.parse(addr), amount: BigInt(amt) };
    }
    return null;
  } catch { return null; }
}

interface Props {
  onClose: () => void;
}

export function EarnScanner({ onClose }: Props) {
  const { address, tonConnectUI } = useTonConnect();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (results: { rawValue: string }[]) => {
      if (processing || !address || results.length === 0) return;
      const raw = results[0].rawValue;
      const parsed = parseQR(raw);
      if (!parsed) { setError('Неверный QR-код'); return; }

      setProcessing(true);
      setError(null);
      try {
        const brandAddrStr = parsed.brandAddress.toString({ urlSafe: true, bounceable: true });
        const userAddrStr = address.toString({ urlSafe: true, bounceable: true });
        const res = await runGetMethod(brandAddrStr, 'walletAddress', [userAddrStr]);
        const { Cell } = await import('@ton/core');
        const cellHex: string = res.stack?.[0]?.cell ?? res.stack?.[0]?.slice;
        const jettonWalletAddress = Cell.fromBoc(Buffer.from(cellHex, 'hex'))[0].beginParse().loadAddress();

        const nonce = BigInt(Date.now());
        const message: TokenTransfer = {
          $$type: 'TokenTransfer',
          queryId: 0n,
          amount: parsed.amount,
          destination: parsed.brandAddress,
          responseDestination: address,
          customPayload: null,
          forwardTonAmount: toNano('0.05'),
          forwardPayload: beginCell().storeUint(1, 8).storeInt(nonce, 64).endCell().asSlice(),
        };

        const payload = beginCell().store(storeTokenTransfer(message)).endCell().toBoc().toString('base64');

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: jettonWalletAddress.toString(), amount: toNano('0.15').toString(), payload }],
        });

        toast.success('Баллы списаны!');
        onClose();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes('User rejects') ? 'Отменено' : 'Ошибка отправки');
      } finally {
        setProcessing(false);
      }
    },
    [address, tonConnectUI, onClose, processing]
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: '#000' }}
      >
        <div
          className="flex items-center justify-between px-4 pt-4 pb-3"
          style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
        >
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', color: '#E0E0E0' }}>
            СКАНИРОВАТЬ QR
          </span>
          <button
            onClick={onClose}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.5)', letterSpacing: '0.1em' }}
          >
            [ESC]
          </button>
        </div>

        <div className="flex-1 relative">
          <Scanner
            onScan={handleScan}
            onError={() => setError('Нет доступа к камере')}
            constraints={{ facingMode: 'environment' }}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '0.5px solid rgba(46,91,255,0.6)',
                  boxShadow: '0 0 40px rgba(46,91,255,0.15), inset 0 0 40px rgba(46,91,255,0.05)',
                }}
              />
              
              {[
                { top: -1, left: -1, borderTop: '2px solid #2E5BFF', borderLeft: '2px solid #2E5BFF' },
                { top: -1, right: -1, borderTop: '2px solid #2E5BFF', borderRight: '2px solid #2E5BFF' },
                { bottom: -1, left: -1, borderBottom: '2px solid #2E5BFF', borderLeft: '2px solid #2E5BFF' },
                { bottom: -1, right: -1, borderBottom: '2px solid #2E5BFF', borderRight: '2px solid #2E5BFF' },
              ].map((style, i) => (
                <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...style }} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 text-center" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {processing ? (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2E5BFF', letterSpacing: '0.1em' }} className="animate-pulse">
              ОТПРАВКА ТРАНЗАКЦИИ...
            </p>
          ) : error ? (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#ff4444' }}>
              ОШИБКА: {error}
            </p>
          ) : (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(224,224,224,0.3)', letterSpacing: '0.08em' }}>
              // Наведите камеру на QR-код бренда
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
