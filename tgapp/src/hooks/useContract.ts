import { useMemo } from 'react';
import { useTonClient } from './useTonClient';
import { ContractService } from '../services/contractService';

export function useContract() {
  const client = useTonClient();

  const contractService = useMemo(() => {
    if (!client) return null;
    
    const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS;
    if (!factoryAddress) {
      console.error('VITE_FACTORY_ADDRESS not set in .env');
      return null;
    }

    return new ContractService(client, factoryAddress);
  }, [client]);

  return contractService;
}
