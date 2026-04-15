import { Address, toNano, beginCell, Cell, Dictionary } from '@ton/core';
import { storeCreateBrand, CreateBrand } from '../contracts/Factory';
import { storeMintTo, storeProposeRate, storeAcceptRate, storeRejectProposal, MintTo, ProposeRate, AcceptRate, RejectProposal } from '../contracts/BrandJetton';
import { storeTokenTransfer, TokenTransfer } from '../contracts/JettonWallet';
import { getJettonInfo, getBatchJettonInfo, getUserJettons, runGetMethod, JettonMetadata } from './tonApiService';

export interface BrandInfo {
  address: string;
  admin: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: string;
}

export interface BrandBalance {
  brand: Address;
  balance: bigint;
  meta: {
    name: string;
    symbol: string;
    description: string;
    image: string;
  };
}

export class ContractService {
  private factoryAddress: string;

  private brandsCache: Address[] | null = null;
  private metaCache = new Map<string, JettonMetadata>();
  private pairsCache = new Map<string, { pairs: { brand: Address; rate: number }[]; ts: number }>();
  private readonly PAIRS_TTL = 30_000;

  constructor(_client: unknown, factoryAddress: string) {
    this.factoryAddress = factoryAddress;
  }

  clearCache() {
    this.brandsCache = null;
    this.metaCache.clear();
    this.pairsCache.clear();
  }

  getCachedMeta(brandAddress: Address): JettonMetadata | undefined {
    return this.metaCache.get(brandAddress.toRawString());
  }

  async checkFactoryActive(): Promise<boolean> {
    try {
      const res = await runGetMethod(this.factoryAddress, 'brandCount');
      return !!res?.stack;
    } catch {
      return false;
    }
  }

  async getAllBrands(): Promise<Address[]> {
    if (this.brandsCache !== null) return this.brandsCache;

    const countResult = await runGetMethod(this.factoryAddress, 'brandCount');
    const numHex: string = countResult.stack?.[0]?.num ?? '0x0';
    const count = Number(BigInt(numHex));
    console.log(`getAllBrands: factory has ${count} brands`);

    if (count === 0) {
      this.brandsCache = [];
      return [];
    }

    const brands: Address[] = [];
    const CHUNK = 5;

    for (let i = 0; i < count; i += CHUNK) {
      const indices = Array.from({ length: Math.min(CHUNK, count - i) }, (_, k) => i + k);
      const results = await Promise.all(
        indices.map(async (idx) => {
          try {
            const res = await runGetMethod(this.factoryAddress, 'brandAddress', [idx.toString()]);
            const stackItem = res.stack?.[0];
            if (!stackItem) return null;
            const cellHex: string = stackItem.cell ?? stackItem.slice ?? null;
            if (!cellHex) return null;
            const cell = Cell.fromBoc(Buffer.from(cellHex, 'hex'))[0];
            return cell.beginParse().loadAddress();
          } catch (e) {
            console.warn(`getAllBrands: failed to fetch brand[${idx}]`, e);
            return null;
          }
        })
      );
      brands.push(...results.filter((a): a is Address => a !== null));
    }

    this.brandsCache = brands;
    return brands;
  }

  async getBrandInfo(brandAddress: Address): Promise<BrandInfo | null> {
    const key = brandAddress.toRawString();
    if (this.metaCache.has(key)) {
      const m = this.metaCache.get(key)!;
      return { address: key, admin: m.admin ?? '', name: m.name, symbol: m.symbol, description: m.description, image: m.image, totalSupply: m.totalSupply };
    }
    const info = await getJettonInfo(brandAddress.toString({ urlSafe: true, bounceable: true }));
    if (!info) return null;
    this.metaCache.set(key, info);
    return { address: key, admin: info.admin ?? '', name: info.name, symbol: info.symbol, description: info.description, image: info.image, totalSupply: info.totalSupply };
  }

  async getUserBalances(userAddress: Address, attempts = 3): Promise<BrandBalance[]> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this._fetchUserBalances(userAddress);
      } catch (e) {
        lastError = e;
        if (i < attempts - 1) await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw lastError;
  }

  private async _fetchUserBalances(userAddress: Address): Promise<BrandBalance[]> {
    const [brands, userJettons] = await Promise.all([
      this.getAllBrands(),
      getUserJettons(userAddress.toString({ urlSafe: true, bounceable: true })),
    ]);

    const balanceMap = new Map<string, bigint>();
    for (const j of userJettons) {
      try {
        const raw = Address.parse(j.masterAddress).toRawString();
        balanceMap.set(raw, BigInt(j.balance));
      } catch {}
    }

    const brandStrings = brands.map(b => b.toString({ urlSafe: true, bounceable: true }));
    const infoMap = await getBatchJettonInfo(brandStrings);

    const results: BrandBalance[] = [];
    for (const brandAddr of brands) {
      const raw = brandAddr.toRawString();
      const bounceable = brandAddr.toString({ urlSafe: true, bounceable: true });
      let info = infoMap.get(bounceable);

      if (!info) {
        info = await this._getBrandMetaFromContract(brandAddr);
      }

      const meta = info
        ? { name: info.name, symbol: info.symbol, description: info.description, image: info.image }
        : { name: `Brand ${bounceable.slice(0, 6)}…`, symbol: '???', description: '', image: '' };

      if (info) this.metaCache.set(raw, info);

      results.push({
        brand: brandAddr,
        balance: balanceMap.get(raw) ?? 0n,
        meta,
      });
    }

    return results;
  }

  async getOwnedBrands(userAddress: Address): Promise<{ address: Address; info: BrandInfo }[]> {
    const brands = await this.getAllBrands();
    const brandStrings = brands.map(b => b.toString({ urlSafe: true, bounceable: true }));
    const infoMap = await getBatchJettonInfo(brandStrings);

    const userRaw = userAddress.toRawString();
    const owned: { address: Address; info: BrandInfo }[] = [];

    for (const brandAddr of brands) {
      const bounceable = brandAddr.toString({ urlSafe: true, bounceable: true });
      const info = infoMap.get(bounceable);
      if (!info) continue;

      let adminRaw = '';
      try { if (info.admin) adminRaw = Address.parse(info.admin).toRawString(); } catch {}
      if (adminRaw !== userRaw) continue;

      owned.push({
        address: brandAddr,
        info: {
          address: brandAddr.toRawString(),
          admin: info.admin ?? '',
          name: info.name,
          symbol: info.symbol,
          description: info.description,
          image: info.image,
          totalSupply: info.totalSupply,
        },
      });
    }

    return owned;
  }

  private async _getBrandMetaFromContract(brandAddress: Address): Promise<JettonMetadata | null> {
    try {
      const addrStr = brandAddress.toString({ urlSafe: true, bounceable: true });
      const res = await runGetMethod(addrStr, 'data');
      const stack = res?.stack;
      if (!stack || stack.length < 6) return null;
      const getString = (item: any): string => {
        if (!item) return '';
        if (item.type === 'slice' || item.type === 'cell') {
          try {
            const hex: string = item.cell ?? item.slice ?? '';
            if (!hex) return '';
            const cell = Cell.fromBoc(Buffer.from(hex, 'hex'))[0];
            const slice = cell.beginParse();
            const bytes: number[] = [];
            while (slice.remainingBits >= 8) bytes.push(slice.loadUint(8));
            return Buffer.from(bytes).toString('utf8');
          } catch { return ''; }
        }
        return '';
      };
      const name = getString(stack[2]);
      const symbol = getString(stack[3]);
      const description = getString(stack[4]);
      const imageUrl = getString(stack[5]);
      return { address: addrStr, name, symbol, description, image: imageUrl, admin: null, totalSupply: '0' };
    } catch {
      return null;
    }
  }

  buildCreateBrandPayload(params: { name: string; description: string; symbol: string; image: string }): {
    address: string; amount: string; payload: string;
  } {
    const message: CreateBrand = {
      $$type: 'CreateBrand',
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      imageUrl: params.image,
    };
    return {
      address: this.factoryAddress,
      amount: toNano('1.1').toString(),
      payload: beginCell().store(storeCreateBrand(message)).endCell().toBoc().toString('base64'),
    };
  }

  buildMintPayload(params: { brandAddress: Address; to: Address; amount: bigint }): {
    address: string; amount: string; payload: string;
  } {
    const message: MintTo = {
      $$type: 'MintTo', queryId: 0n, to: params.to, amount: params.amount,
    };
    return {
      address: params.brandAddress.toString(),
      amount: toNano('0.2').toString(),
      payload: beginCell().store(storeMintTo(message)).endCell().toBoc().toString('base64'),
    };
  }

  buildSetExchangeRatePayload(params: {
    brandAddress: Address; jettonMasterAddress: Address; rate: bigint;
  }): { address: string; amount: string; payload: string } {
    const message: ProposeRate = {
      $$type: 'ProposeRate', targetBrand: params.jettonMasterAddress, rate: params.rate,
    };
    return {
      address: params.brandAddress.toString(),
      amount: toNano('0.05').toString(),
      payload: beginCell().store(storeProposeRate(message)).endCell().toBoc().toString('base64'),
    };
  }

  buildAcceptRatePayload(params: {
    brandAddress: Address; sourceBrand: Address;
  }): { address: string; amount: string; payload: string } {
    const message: AcceptRate = {
      $$type: 'AcceptRate', sourceBrand: params.sourceBrand,
    };
    return {
      address: params.brandAddress.toString(),
      amount: toNano('0.05').toString(),
      payload: beginCell().store(storeAcceptRate(message)).endCell().toBoc().toString('base64'),
    };
  }

  buildRejectProposalPayload(params: {
    brandAddress: Address; proposerBrand: Address;
  }): { address: string; amount: string; payload: string } {
    const message: RejectProposal = {
      $$type: 'RejectProposal', fromBrand: params.proposerBrand,
    };
    return {
      address: params.brandAddress.toString(),
      amount: toNano('0.05').toString(),
      payload: beginCell().store(storeRejectProposal(message)).endCell().toBoc().toString('base64'),
    };
  }

  async getActivePairs(fromBrand: Address, otherBrands: Address[]): Promise<{ brand: Address; rate: number }[]> {
    const fromRaw = fromBrand.toRawString();

    const cached = this.pairsCache.get(fromRaw);
    if (cached && Date.now() - cached.ts < this.PAIRS_TTL) return cached.pairs;

    const results = await Promise.all(
      otherBrands.filter(t => t.toRawString() !== fromRaw).map(async (target) => {
        try {
          const fromAddr = fromBrand.toString({ urlSafe: true, bounceable: true });
          const targetAddr = target.toString({ urlSafe: true, bounceable: true });
          const [activeRes, rateRes] = await Promise.all([
            runGetMethod(fromAddr, 'swapActive', [targetAddr]),
            runGetMethod(fromAddr, 'proposedRate', [targetAddr]),
          ]);
          const active = !!parseInt(activeRes.stack?.[0]?.num ?? '0x0', 16);
          const rate = parseInt(rateRes.stack?.[0]?.num ?? '0x0', 16);
          if (active && rate > 0) return { brand: target, rate };
        } catch {}
        return null;
      })
    );
    const pairs = results.filter((r): r is { brand: Address; rate: number } => r !== null);
    this.pairsCache.set(fromRaw, { pairs, ts: Date.now() });
    return pairs;
  }

  async getIncomingProposals(brandAddress: Address): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    try {
      const res = await runGetMethod(
        brandAddress.toString({ urlSafe: true, bounceable: true }),
        'getIncomingProposals'
      );
      const stackItem = res.stack?.[0];
      if (!stackItem || stackItem.type === 'null') return result;
      const cellHex: string = stackItem.cell ?? stackItem.slice;
      if (!cellHex) return result;
      const cell = Cell.fromBoc(Buffer.from(cellHex, 'hex'))[0];
      const dict = Dictionary.loadDirect(
        Dictionary.Keys.Address(),
        Dictionary.Values.BigInt(257),
        cell.beginParse()
      );
      for (const [key, val] of dict) {
        try {
          result.set(key.toString({ urlSafe: true, bounceable: true }), Number(val));
        } catch {}
      }
    } catch {}
    return result;
  }

  async buildSwapPayload(params: {
    fromBrandAddress: Address; toBrandAddress: Address; amount: bigint; userAddress: Address;
  }): Promise<{ address: string; amount: string; payload: string }> {
    const res = await runGetMethod(
      params.fromBrandAddress.toString({ urlSafe: true, bounceable: true }),
      'walletAddress',
      [params.userAddress.toString({ urlSafe: true, bounceable: true })]
    );
    const cellHex: string = res.stack?.[0]?.cell ?? res.stack?.[0]?.slice;
    const walletAddress = Cell.fromBoc(Buffer.from(cellHex, 'hex'))[0].beginParse().loadAddress();

    const message: TokenTransfer = {
      $$type: 'TokenTransfer',
      queryId: 0n,
      amount: params.amount,
      destination: params.fromBrandAddress,
      responseDestination: params.userAddress,
      customPayload: null,
      forwardTonAmount: toNano('0.05'),
      forwardPayload: beginCell().storeUint(2, 8).storeAddress(params.toBrandAddress).endCell().asSlice(),
    };
    return {
      address: walletAddress.toString(),
      amount: toNano('0.5').toString(),
      payload: beginCell().store(storeTokenTransfer(message)).endCell().toBoc().toString('base64'),
    };
  }

  static isValidAddress(addr: string): boolean {
    try { Address.parse(addr); return true; } catch { return false; }
  }

  static toBounceable(addr: string): string {
    try { return Address.parse(addr).toString(); } catch { return addr; }
  }
}
