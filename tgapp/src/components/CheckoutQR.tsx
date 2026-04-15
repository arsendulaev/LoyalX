import { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-5">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">QR для кассы</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Бренд</label>
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {brands.map(b => (
              <option key={b.address.toString()} value={b.address.toString()}>
                {b.name} ({b.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Количество токенов к списанию
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            placeholder="10"
            min="0.01"
            step="0.01"
          />
          {selectedMeta && amount && Number(amount) > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Клиент спишет {amount} {selectedMeta.symbol}
            </p>
          )}
        </div>

        {qrUrl ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-100">
              <QRCodeSVG value={qrUrl} size={200} />
            </div>
            <p className="text-xs text-gray-400 text-center break-all px-2">{qrUrl}</p>
            <p className="text-xs text-indigo-600 text-center">
              Покажите QR клиенту — он сканирует приложением LoyalX
            </p>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
            Введите сумму для генерации QR
          </div>
        )}
      </div>
    </div>
  );
}
