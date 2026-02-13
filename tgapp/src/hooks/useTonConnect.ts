import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { useMemo } from 'react';

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const addressString = useTonAddress();

  const address = useMemo(() => {
    return addressString ? Address.parse(addressString) : null;
  }, [addressString]);

  return {
    address,
    connected: !!addressString,
    tonConnectUI,
    disconnect: () => tonConnectUI.disconnect(),
  };
}
