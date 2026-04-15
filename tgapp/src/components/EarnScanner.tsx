import { useState, useCallback } from 'react';
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
      return {
        brandAddress: Address.parse(addressPart),
        amount: BigInt(amountParam),
      };
    }
    if (raw.includes(':')) {
      const [addr, amt] = raw.split(':');
      return { brandAddress: Address.parse(addr), amount: BigInt(amt) };
    }
    return null;
  } catch {
    return null;
  }
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
      if (!parsed) {
        setError('Неверный QR-код');
        return;
      }

      setProcessing(true);
      setError(null);
      try {
        const brandAddrStr = parsed.brandAddress.toString({ urlSafe: true, bounceable: true });
        const userAddrStr = address.toString({ urlSafe: true, bounceable: true });

        const res = await runGetMethod(brandAddrStr, 'walletAddress', [userAddrStr]);
        const { Cell } = await import('@ton/core');
        const cellHex: string = res.stack?.[0]?.cell ?? res.stack?.[0]?.slice;
        const jettonWalletAddress = Cell.fromBoc(Buffer.from(cellHex, 'hex'))[0]
          .beginParse()
          .loadAddress();

        const nonce = BigInt(Date.now());
        const message: TokenTransfer = {
          $$type: 'TokenTransfer',
          queryId: 0n,
          amount: parsed.amount,
          destination: parsed.brandAddress,
          responseDestination: address,
          customPayload: null,
          forwardTonAmount: toNano('0.05'),
          forwardPayload: beginCell()
            .storeUint(1, 8)
            .storeInt(nonce, 64)
            .endCell()
            .asSlice(),
        };

        const payload = beginCell()
          .store(storeTokenTransfer(message))
          .endCell()
          .toBoc()
          .toString('base64');

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: jettonWalletAddress.toString(),
              amount: toNano('0.15').toString(),
              payload,
            },
          ],
        });

        toast.success('Баллы списаны!');
        onClose();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes('User rejects') ? 'Отменено' : 'Ошибка при отправке');
      } finally {
        setProcessing(false);
      }
    },
    [address, tonConnectUI, onClose, processing]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-white text-lg font-semibold">Сканировать QR</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
        >
          ✕
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
          <div className="w-56 h-56 border-2 border-white rounded-2xl opacity-70" />
        </div>
      </div>

      <div className="px-4 py-4 text-center">
        {processing ? (
          <p className="text-indigo-300 text-sm animate-pulse">Отправляем транзакцию…</p>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : (
          <p className="text-gray-400 text-sm">Наведите камеру на QR-код бренда</p>
        )}
      </div>
    </div>
  );
}
