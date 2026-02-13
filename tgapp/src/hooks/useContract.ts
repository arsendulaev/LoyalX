import { useTonClient } from './useTonClient';
import { ContractService } from '../services/contractService';

const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS || 'EQBJOqlUdtZYjNMTaRFWQoxDRZELF6IYj5jT1U0M40TT7Kua';

// создаём сервис один раз
let contractServiceInstance: ContractService | null = null;

export function useContract() {
  const client = useTonClient();

  if (!contractServiceInstance) {
    contractServiceInstance = new ContractService(client, factoryAddress);
  }

  return contractServiceInstance;
}
