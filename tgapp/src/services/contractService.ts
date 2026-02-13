import { Address, toNano, beginCell, Cell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { Factory, storeCreateBrand } from '../contracts/Factory';
import { BrandJetton, storeMintTo, storeSetExchangeRate } from '../contracts/BrandJetton';
import { JettonWallet, storeTransfer } from '../contracts/JettonWallet';
import type { CreateBrand } from '../contracts/Factory';
import type { MintTo, SetExchangeRate } from '../contracts/BrandJetton';
import type { Transfer } from '../contracts/JettonWallet';

export class ContractService {
  private client: TonClient;
  private factoryAddress: Address;

  constructor(client: TonClient, factoryAddress: string) {
    this.client = client;
    this.factoryAddress = Address.parse(factoryAddress);
  }

  async getFactory() {
    return this.client.open(Factory.fromAddress(this.factoryAddress));
  }

  // проверяем что Factory контракт развёрнут и доступен
  async checkFactoryActive(): Promise<boolean> {
    try {
      const state = await this.client.getContractState(this.factoryAddress);
      return state.state === 'active';
    } catch {
      return false;
    }
  }

  async getAllBrands(): Promise<Address[]> {
    const factory = await this.getFactory();
    const brands: Address[] = [];

    try {
      const brandCount = await factory.getNumBrands();
      for (let i = 0n; i < brandCount; i++) {
        const addr = await factory.getBrandAddress(i);
        if (addr) brands.push(addr);
      }
    } catch (error) {
      console.error('getAllBrands error:', error);
    }

    return brands;
  }

  async getBrandInfo(brandAddress: Address) {
    const brand = this.client.open(BrandJetton.fromAddress(brandAddress));

    try {
      const data = await brand.getGetJettonData();
      return {
        totalSupply: data.totalSupply,
        mintable: data.mintable,
        admin: data.admin,
        content: data.content,
        walletCode: data.walletCode,
      };
    } catch (error) {
      console.error('getBrandInfo error:', error);
      return null;
    }
  }

  // парсим TEP-64 off-chain metadata
  parseBrandMetadata(content: Cell): { name: string; symbol: string; description: string; image: string } {
    const defaults = { name: 'Unknown', symbol: '???', description: '', image: '' };
    try {
      const slice = content.beginParse();
      const tag = slice.loadUint(8);
      if (tag === 0x01) {
        const json = JSON.parse(slice.loadStringTail());
        return {
          name: json.name || defaults.name,
          symbol: json.symbol || defaults.symbol,
          description: json.description || defaults.description,
          image: json.image || defaults.image,
        };
      }
    } catch {}
    return defaults;
  }

  async getUserWalletAddress(brandAddress: Address, userAddress: Address): Promise<Address> {
    const brand = this.client.open(BrandJetton.fromAddress(brandAddress));
    return await brand.getGetWalletAddress(userAddress);
  }

  async getUserBalance(brandAddress: Address, userAddress: Address): Promise<bigint> {
    try {
      const walletAddress = await this.getUserWalletAddress(brandAddress, userAddress);
      const wallet = this.client.open(JettonWallet.fromAddress(walletAddress));
      const data = await wallet.getGetWalletData();
      return data.balance;
    } catch {
      return 0n;
    }
  }

  async getUserBalances(userAddress: Address) {
    const brands = await this.getAllBrands();
    const results: { brand: Address; balance: bigint; meta: { name: string; symbol: string; description: string; image: string } }[] = [];

    for (const brandAddr of brands) {
      try {
        const [balance, info] = await Promise.all([
          this.getUserBalance(brandAddr, userAddress),
          this.getBrandInfo(brandAddr),
        ]);
        const meta = info?.content ? this.parseBrandMetadata(info.content) : { name: 'Unknown', symbol: '???', description: '', image: '' };
        results.push({ brand: brandAddr, balance, meta });
      } catch {}
    }

    return results;
  }

  // --- Создание бренда ---
  buildCreateBrandPayload(params: { name: string; description: string; symbol: string; image: string }): {
    address: string;
    amount: string;
    payload: string;
  } {
    const content = beginCell()
      .storeUint(0x01, 8)
      .storeStringTail(JSON.stringify({
        name: params.name,
        description: params.description,
        symbol: params.symbol,
        image: params.image,
      }))
      .endCell();

    const message: CreateBrand = {
      $$type: 'CreateBrand',
      brandName: params.name,
      ticker: params.symbol,
      content,
    };

    return {
      address: this.factoryAddress.toString(),
      amount: toNano('0.5').toString(),
      payload: beginCell().store(storeCreateBrand(message)).endCell().toBoc().toString('base64'),
    };
  }

  // --- Минтинг токенов ---
  buildMintPayload(params: { brandAddress: Address; to: Address; amount: bigint }): {
    address: string;
    amount: string;
    payload: string;
  } {
    const message: MintTo = {
      $$type: 'MintTo',
      to: params.to,
      amount: params.amount,
    };

    return {
      address: params.brandAddress.toString(),
      amount: toNano('0.15').toString(),
      payload: beginCell().store(storeMintTo(message)).endCell().toBoc().toString('base64'),
    };
  }

  // --- Установка курса обмена ---
  buildSetExchangeRatePayload(params: {
    brandAddress: Address;
    jettonWalletAddress: Address;
    rate: bigint;
  }): {
    address: string;
    amount: string;
    payload: string;
  } {
    const message: SetExchangeRate = {
      $$type: 'SetExchangeRate',
      jettonWalletAddress: params.jettonWalletAddress,
      rate: params.rate,
    };

    return {
      address: params.brandAddress.toString(),
      amount: toNano('0.05').toString(),
      payload: beginCell().store(storeSetExchangeRate(message)).endCell().toBoc().toString('base64'),
    };
  }

  // --- Обмен (Transfer из JettonWallet пользователя) ---
  async buildSwapPayload(params: {
    fromBrandAddress: Address;
    toBrandAddress: Address;
    amount: bigint;
    userAddress: Address;
  }): Promise<{
    address: string;
    amount: string;
    payload: string;
  }> {
    const walletAddress = await this.getUserWalletAddress(params.fromBrandAddress, params.userAddress);

    const message: Transfer = {
      $$type: 'Transfer',
      queryId: 0n,
      amount: params.amount,
      destination: params.toBrandAddress,
      responseDestination: params.userAddress,
      customPayload: null,
      forwardTonAmount: toNano('0.05'),
      forwardPayload: beginCell().endCell().asSlice(),
    };

    return {
      address: walletAddress.toString(),
      amount: toNano('0.25').toString(),
      payload: beginCell().store(storeTransfer(message)).endCell().toBoc().toString('base64'),
    };
  }

  // валидация адреса TON
  static isValidAddress(addr: string): boolean {
    try {
      Address.parse(addr);
      return true;
    } catch {
      return false;
    }
  }
}
