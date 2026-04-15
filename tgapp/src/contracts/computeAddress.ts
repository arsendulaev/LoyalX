import { Address } from '@ton/core';

const HARDCODED_FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS as string | undefined;

export function computeFactoryAddress(): Address {
  if (!HARDCODED_FACTORY_ADDRESS) {
    throw new Error(
      'Factory address not set. Deploy the new Factory contract and set VITE_FACTORY_ADDRESS in tgapp/.env'
    );
  }
  return Address.parse(HARDCODED_FACTORY_ADDRESS);
}
