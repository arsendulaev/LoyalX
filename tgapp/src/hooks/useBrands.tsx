import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Address } from '@ton/core';
import { BrandBalance } from '../services/contractService';
import { useTonConnect } from './useTonConnect';
import { useContract } from './useContract';
import { registerForNotifications } from '../services/notificationService';
import { useIsConnectionRestored } from '@tonconnect/ui-react';

export interface BrandEntry {
  address: Address;
  name: string;
  symbol: string;
  isOwner: boolean;
}

interface BrandsState {
  brands: BrandEntry[];
  balances: BrandBalance[];
  loading: boolean;
  polling: boolean;
  error: string | null;
  reload: (forceRefresh?: boolean) => Promise<void>;
}

const BrandsContext = createContext<BrandsState | null>(null);

export function BrandsProvider({ children }: { children: ReactNode }) {
  const { address, connected } = useTonConnect();
  const connectionRestored = useIsConnectionRestored();
  const contractService = useContract();

  const [brands, setBrands] = useState<BrandEntry[]>([]);
  const [balances, setBalances] = useState<BrandBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setPolling(false);
  };

  const startPolling = useCallback((prevCount: number) => {
    if (!address) return;
    let attempts = 0;
    const MAX = 6;
    setPolling(true);
    const tick = async () => {
      if (attempts >= MAX) { setPolling(false); return; }
      attempts++;
      contractService.clearCache();
      try {
        const data = await contractService.getUserBalances(address);
        setBalances(data);
        updateBrands(data, address);
        if (data.length > prevCount) { setPolling(false); return; }
      } catch {}
      pollRef.current = setTimeout(tick, 8000);
    };
    pollRef.current = setTimeout(tick, 8000);
  }, [address, contractService]);

  const updateBrands = (data: BrandBalance[], userAddress: Address) => {
    const userRaw = userAddress.toRawString();
    const entries: BrandEntry[] = data.map(b => {
      const cached = contractService.getCachedMeta(b.brand);
      let isOwner = false;
      try { if (cached?.admin) isOwner = Address.parse(cached.admin).toRawString() === userRaw; } catch {}
      return { address: b.brand, name: b.meta.name, symbol: b.meta.symbol, isOwner };
    });
    setBrands(entries);
  };

  const reload = useCallback(async (forceRefresh = false) => {
    if (!connected || !address) return;
    if (forceRefresh) contractService.clearCache();
    stopPolling();
    setLoading(true);
    setError(null);
    try {
      const data = await contractService.getUserBalances(address);
      setBalances(data);
      updateBrands(data, address);
      if (data.length === 0) startPolling(0);
      const brandAddrs = data.map(b => b.brand.toString({ urlSafe: true, bounceable: true }));
      registerForNotifications(address.toString({ urlSafe: true, bounceable: true }), brandAddrs);
    } catch (e: any) {
      setError('Не удалось загрузить данные');
      console.error('BrandsProvider load error:', e);
    } finally {
      setLoading(false);
    }
  }, [connected, address, contractService]);

  useEffect(() => {
    if (!connectionRestored) return;
    if (connected && address) {
      reload();
    } else {
      setBrands([]);
      setBalances([]);
      stopPolling();
    }
    return stopPolling;
  }, [connected, address, connectionRestored]);

  return (
    <BrandsContext.Provider value={{ brands, balances, loading, polling, error, reload }}>
      {children}
    </BrandsContext.Provider>
  );
}

export function useBrands(): BrandsState {
  const ctx = useContext(BrandsContext);
  if (!ctx) throw new Error('useBrands must be used within BrandsProvider');
  return ctx;
}
