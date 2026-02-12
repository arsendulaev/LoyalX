import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address } from '@ton/core';

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();

  return {
    address: address ? Address.parse(address) : null,
    connected: !!address,
    tonConnectUI,
    disconnect: () => tonConnectUI.disconnect(),
  };
}
