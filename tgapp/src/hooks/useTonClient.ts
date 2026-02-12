import { TonClient } from '@ton/ton';
import { useEffect, useState } from 'react';

export function useTonClient() {
  const [client, setClient] = useState<TonClient | null>(null);

  useEffect(() => {
    // Используем testnet для разработки
    const tonClient = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.VITE_TON_API_KEY || undefined,
    });
    setClient(tonClient);
  }, []);

  return client;
}
