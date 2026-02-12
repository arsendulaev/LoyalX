import { TonClient } from '@ton/ton';
import { useMemo } from 'react';

export function useTonClient() {
  const client = useMemo(() => {
    return new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: import.meta.env.VITE_TON_API_KEY || undefined,
    });
  }, []);

  return client;
}
