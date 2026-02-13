import { useMemo } from 'react';
import { useTonClient } from './useTonClient';
import { ContractService } from '../services/contractService';

export function useContract() {
  const client = useTonClient();

  const contractService = useMemo(() => {
    if (!client) return null;
    
    const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS || 'EQBJOqlUdtZYjNMTaRFWQoxDRZELF6IYj5jT1U0M40TT7Kua';
    
    return new ContractService(client, factoryAddress);
  }, [client]);

  return contractService;
}
