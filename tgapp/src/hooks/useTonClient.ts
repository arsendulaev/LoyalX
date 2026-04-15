import { TonClient } from '@ton/ton';
import { useRef } from 'react';

// Используем testnet endpoint
function createTonClient(): TonClient {
  return new TonClient({
    endpoint: 'https://testnet.tonhubapi.com/jsonRPC',
  });
}

// глобальный инстанс (ленивая инициализация)
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
