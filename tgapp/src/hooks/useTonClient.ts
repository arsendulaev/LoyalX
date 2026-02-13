import { TonClient } from '@ton/ton';
import { useState } from 'react';

// создаём клиент один раз вне компонента
const tonClient = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

export function useTonClient() {
  return tonClient;
}
