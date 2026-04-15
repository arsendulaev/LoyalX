import { Address, toNano, beginCell, Cell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { Factory, storeCreateBrand, CreateBrand } from '../contracts/Factory';
import { BrandJetton, storeMintTo, storeSetExchangeRate, MintTo, SetExchangeRate } from '../contracts/BrandJetton';
import { JettonWallet, storeTransfer, Transfer } from '../contracts/JettonWallet';

export class ContractService {
  private client: TonClient;
  private factoryAddress: Address;

  private brandsCache: { brands: Address[]; timestamp: number } | null = null;
  private brandInfoCache: Map<string, { info: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 120000; // 2 минуты
  
  // для объединения запросов (Promise deduplication)
  private getAllBrandsPromise: Promise<Address[]> | null = null;

  constructor(client: TonClient, factoryAddress: string) {
    this.client = client;
    this.factoryAddress = Address.parse(factoryAddress);
  }

  // утилита для задержки
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // сброс кеша (для ручного обновления)
  clearCache() {
    this.brandsCache = null;
    this.brandInfoCache.clear();
    this.getAllBrandsPromise = null;
  }

  async getFactory() {
    return this.client.open(Factory.fromAddress(this.factoryAddress));
  }

  // проверка активности контракта Factory
  async checkFactoryActive(): Promise<boolean> {
    try {
      const state = await this.client.getContractState(this.factoryAddress);
      return state.state === 'active';
    } catch {
      return false;
    }
  }

  async getAllBrands(): Promise<Address[]> {
    // 1. Проверяем кеш
    if (this.brandsCache && Date.now() - this.brandsCache.timestamp < this.CACHE_TTL) {
      return this.brandsCache.brands;
    }

    // 2. Если запрос уже идёт - возвращаем его Promise
    if (this.getAllBrandsPromise) {
      return this.getAllBrandsPromise;
    }

    // 3. Создаем новый запрос
    this.getAllBrandsPromise = (async () => {
      try {
        const factory = await this.getFactory();
        const brands: Address[] = [];
        const brandCount = await factory.getNumBrands();
        
        console.log(`Fetching ${brandCount} brands...`);

        for (let i = 0n; i < brandCount; i++) {
          try {
            // Добавляем задержку между запросами чтобы не ловить 429
            await this.delay(1500); 
            const addr = await factory.getBrandAddress(i);
            if (addr) brands.push(addr);
          } catch (e) {
            console.warn(`Failed to fetch brand ${i}`, e);
          }
        }
        
        this.brandsCache = { brands, timestamp: Date.now() };
        return brands;
      } catch (error) {
        console.error('getAllBrands error:', error);
        throw error;
      } finally {
        this.getAllBrandsPromise = null;
      }
    })();

    return this.getAllBrandsPromise;
  }

  async getBrandInfo(brandAddress: Address, retries = 3) {
    const key = brandAddress.toString();
    
    // Проверяем кеш
    const cached = this.brandInfoCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.info;
    }

    // Задержка перед запросом инфо
    await this.delay(1000);

    const brand = this.client.open(BrandJetton.fromAddress(brandAddress));

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const data = await brand.getGetJettonData();
        const info = {
          totalSupply: data.totalSupply,
          mintable: data.mintable,
          admin: data.admin,
          name: data.name,
          symbol: data.symbol,
          walletCode: data.walletCode,
        };

        // сохраняем в кэш
        this.brandInfoCache.set(key, { info, timestamp: Date.now() });
        return info;
      } catch (error: any) {
        const is429 = error?.response?.status === 429 || error?.message?.includes('429');
        if (is429 && attempt < retries - 1) {
          const backoff = (attempt + 1) * 2000; // 2s, 4s, 6s
          console.warn(`getBrandInfo 429 for ${brandAddress.toString()}, retry ${attempt + 1}/${retries} after ${backoff}ms`);
          await this.delay(backoff);
          continue;
        }
        console.error('getBrandInfo error for', brandAddress.toString(), error);
        return null;
      }
    }
    return null;
  }

  // парсим TEP-64 off-chain metadata
  parseBrandMetadata(content: Cell): { name: string; symbol: string; description: string; image: string } {
    const defaults = { name: 'Unknown', symbol: '???', description: '', image: '' };
    try {
      const slice = content.beginParse();
      const tag = slice.loadUint(8);
      console.log('parseBrandMetadata: tag =', tag);
      if (tag === 0x01) {
        const jsonString = slice.loadStringTail();
        console.log('parseBrandMetadata: JSON string =', jsonString);
        const json = JSON.parse(jsonString);
        console.log('parseBrandMetadata: parsed =', json);
        return {
          name: json.name || defaults.name,
          symbol: json.symbol || defaults.symbol,
          description: json.description || defaults.description,
          image: json.image || defaults.image,
        };
      } else {
        console.warn('parseBrandMetadata: unexpected tag', tag, 'expected 0x01');
      }
    } catch (error) {
      console.error('parseBrandMetadata error:', error);
    }
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

  async getUserBalances(userAddress: Address, includeZero = true) {
    const brands = await this.getAllBrands();
    console.log('getUserBalances: found', brands.length, 'brands');
    const results: { brand: Address; balance: bigint; meta: { name: string; symbol: string; description: string; image: string } }[] = [];

    for (const brandAddr of brands) {
      try {
        console.log('getUserBalances: processing brand', brandAddr.toString());
        
        // Последовательные запросы вместо параллельных, чтобы не словить 429
        const info = await this.getBrandInfo(brandAddr);
        await this.delay(800); // Задержка между запросами
        const balance = await this.getUserBalance(brandAddr, userAddress);
        
        console.log('getUserBalances: brand', brandAddr.toString(), 'balance:', balance, 'info:', info);
        
        // пропускаем нулевые балансы если не нужны
        if (!includeZero && balance === 0n) continue;
        
        const meta = info ? { name: info.name || 'Unknown', symbol: info.symbol || '???', description: '', image: '' } : { name: 'Unknown', symbol: '???', description: '', image: '' };
        console.log('getUserBalances: parsed meta for', brandAddr.toString(), ':', meta);
        results.push({ brand: brandAddr, balance, meta });
      } catch (err) {
        console.error('getUserBalances error for brand', brandAddr.toString(), err);
      }
    }

    console.log('getUserBalances: returning', results.length, 'results');
    return results;
  }

  // --- Создание бренда ---
  buildCreateBrandPayload(params: { name: string; description: string; symbol: string; image: string }): {
    address: string;
    amount: string;
    payload: string;
  } {
    const message: CreateBrand = {
      $$type: 'CreateBrand',
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.image,
    };

    return {
      address: this.factoryAddress.toString(),
      amount: toNano('0.4').toString(),
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
      amount: toNano('0.2').toString(), // Уменьшено с 0.5 до 0.2
      payload: beginCell().store(storeMintTo(message)).endCell().toBoc().toString('base64'),
    };
  }

  // --- Установка курса обмена ---
  buildSetExchangeRatePayload(params: {
    brandAddress: Address;
    jettonMasterAddress: Address;
    rate: bigint;
  }): {
    address: string;
    amount: string;
    payload: string;
  } {
    const message: SetExchangeRate = {
      $$type: 'SetExchangeRate',
      jettonMasterAddress: params.jettonMasterAddress,
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
      forwardPayload: beginCell().storeAddress(params.fromBrandAddress).endCell().asSlice(),
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

  // конвертация в bounceable формат (EQ...)
  static toBounceable(addr: string): string {
    try {
      return Address.parse(addr).toString();
    } catch {
      return addr;
    }
  }
}