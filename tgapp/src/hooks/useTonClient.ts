import { TonClient } from '@ton/ton';
import { useRef } from 'react';

function createTonClient(): TonClient {
  return new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  });
}

let globalClient: TonClient | null = null;

function getTonClient(): TonClient {
  if (!globalClient) {
    globalClient = createTonClient();
  }
  return globalClient;
}

export function useTonClient() {
  const clientRef = useRef<TonClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = getTonClient();
  }
  return clientRef.current;
}
