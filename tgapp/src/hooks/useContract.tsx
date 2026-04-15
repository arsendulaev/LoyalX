import { createContext, useContext, useRef, ReactNode } from 'react';
import { ContractService } from '../services/contractService';
import { computeFactoryAddress } from '../contracts/computeAddress';

const factoryAddress = computeFactoryAddress().toString();

const ContractContext = createContext<ContractService | null>(null);
export function ContractProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef<ContractService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = new ContractService(null, factoryAddress);
  }
  return (
    <ContractContext.Provider value={serviceRef.current}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract(): ContractService {
  const svc = useContext(ContractContext);
  if (!svc) throw new Error('useContract must be used within ContractProvider');
  return svc;
}
