import { useTonClient } from './useTonClient';
import { ContractService } from '../services/contractService';
import { useMemo } from 'react';

const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS || 'EQBJOqlUdtZYjNMTaRFWQoxDRZELF6IYj5jT1U0M40TT7Kua';

export function useContract() {
  const client = useTonClient();

  return useMemo(() => {
    return new ContractService(client, factoryAddress);
  }, [client]);
}
