import { Address, toNano, beginCell, Cell, Dictionary } from '@ton/core';
import { storeCreateBrand, CreateBrand, loadFactory$Data } from '../contracts/Factory';
import { storeMintTo, storeProposeRate, storeAcceptRate, storeRejectProposal, MintTo, ProposeRate, AcceptRate, RejectProposal, loadBrandJetton$Data } from '../contracts/BrandJetton';
import { storeTokenTransfer, TokenTransfer } from '../contracts/JettonWallet';
import { getBatchJettonInfo, getUserJettons, getAccountData, runGetMethod, JettonMetadata } from './tonApiService';

const META_LS_KEY = 'loyalx:meta:v1';

function loadMetaFromStorage(): Map<string, JettonMetadata> {
  try {
    const raw = localStorage.getItem(META_LS_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

function saveMetaToStorage(map: Map<string, JettonMetadata>) {
  try {
    const obj: Record<string, JettonMetadata> = {};
    map.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(META_LS_KEY, JSON.stringify(obj));
  } catch {}
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
  private metaCache: Map<string, JettonMetadata>;
  private metaMissCache = new Set<string>();
  private pairsCache = new Map<string, { pairs: { brand: Address; rate: number }[]; ts: number }>();
  private readonly PAIRS_TTL = 30_000;

  constructor(factoryAddress: string) {
    this.factoryAddress = factoryAddress;
    this.metaCache = loadMetaFromStorage();
  }

  clearCache() {
    this.brandsCache = null;
    this.pairsCache.clear();
  }

  clearBalancesOnly() {
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

    const dataHex = await getAccountData(this.factoryAddress);
    if (!dataHex) {
      this.brandsCache = [];
      return [];
    }

    try {
      const cell = Cell.fromBoc(Buffer.from(dataHex, 'hex'))[0];
      const slice = cell.beginParse();
      slice.loadBit();
      const parsed = loadFactory$Data(slice);
      const brands: Address[] = [];
      for (const v of parsed.brands.values()) brands.push(v);
      this.brandsCache = brands;
      return brands;
    } catch (e) {
      console.error('getAllBrands: failed to parse factory data', e);
      throw e;
    }
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

    const needFetch = brands.filter(b => {
      const raw = b.toRawString();
      return !this.metaCache.has(raw) && !this.metaMissCache.has(raw);
    });

    if (needFetch.length > 0) {
      const needStrings = needFetch.map(b => b.toString({ urlSafe: true, bounceable: true }));
      const infoMap = await getBatchJettonInfo(needStrings);
      let metaChanged = false;
      for (const b of needFetch) {
        const raw = b.toRawString();
        const bounceable = b.toString({ urlSafe: true, bounceable: true });
        let info = infoMap.get(bounceable);
        if (!info) info = await this._getBrandMetaFromState(b) ?? undefined;
        if (info && info.name) {
          this.metaCache.set(raw, info);
          metaChanged = true;
        } else {
          this.metaMissCache.add(raw);
        }
      }
      if (metaChanged) saveMetaToStorage(this.metaCache);
    }

    const results: BrandBalance[] = [];
    for (const brandAddr of brands) {
      const raw = brandAddr.toRawString();
      const bounceable = brandAddr.toString({ urlSafe: true, bounceable: true });
      const info = this.metaCache.get(raw);
      const meta = info
        ? { name: info.name, symbol: info.symbol, description: info.description, image: info.image }
        : { name: `Brand ${bounceable.slice(0, 6)}…`, symbol: '???', description: '', image: '' };

      results.push({
        brand: brandAddr,
        balance: balanceMap.get(raw) ?? 0n,
        meta,
      });
    }

    return results;
  }

  private async _getBrandMetaFromState(brandAddress: Address): Promise<JettonMetadata | null> {
    try {
      const addrStr = brandAddress.toString({ urlSafe: true, bounceable: true });
      const dataHex = await getAccountData(addrStr);
      if (!dataHex) return null;
      const cell = Cell.fromBoc(Buffer.from(dataHex, 'hex'))[0];
      const slice = cell.beginParse();
      slice.loadBit();
      const parsed = loadBrandJetton$Data(slice);
      return {
        address: addrStr,
        name: parsed.name,
        symbol: parsed.symbol,
        description: parsed.description,
        image: parsed.imageUrl,
        admin: parsed.owner.toString({ urlSafe: true, bounceable: true }),
        totalSupply: parsed.totalSupply.toString(),
      };
    } catch (e) {
      console.warn('_getBrandMetaFromState failed', e);
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

    const others = otherBrands.filter(t => t.toRawString() !== fromRaw);
    const fromAddr = fromBrand.toString({ urlSafe: true, bounceable: true });

    try {
      const dataHex = await getAccountData(fromAddr);
      if (dataHex) {
        const cell = Cell.fromBoc(Buffer.from(dataHex, 'hex'))[0];
        const slice = cell.beginParse();
        slice.loadBit();
        const parsed = loadBrandJetton$Data(slice);

        const otherSet = new Set(others.map(t => t.toRawString()));
        const pairs: { brand: Address; rate: number }[] = [];
        for (const [target, rate] of parsed.proposedRates) {
          const targetRaw = target.toRawString();
          if (!otherSet.has(targetRaw)) continue;
          if (parsed.acceptedByPeer.get(target) !== true) continue;
          const r = Number(rate);
          if (r > 0) pairs.push({ brand: target, rate: r });
        }
        this.pairsCache.set(fromRaw, { pairs, ts: Date.now() });
        return pairs;
      }
    } catch (e) {
      console.warn('getActivePairs: state parse failed, falling back to get-methods', e);
    }

    const results = await Promise.all(
      others.map(async (target) => {
        try {
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
    const addrStr = brandAddress.toString({ urlSafe: true, bounceable: true });

    try {
      const dataHex = await getAccountData(addrStr);
      if (dataHex) {
        const cell = Cell.fromBoc(Buffer.from(dataHex, 'hex'))[0];
        const slice = cell.beginParse();
        slice.loadBit();
        const parsed = loadBrandJetton$Data(slice);
        for (const [key, val] of parsed.incomingProposals) {
          try {
            result.set(key.toString({ urlSafe: true, bounceable: true }), Number(val));
          } catch {}
        }
        return result;
      }
    } catch (e) {
      console.warn('getIncomingProposals: state parse failed, falling back to get-method', e);
    }

    try {
      const res = await runGetMethod(addrStr, 'getIncomingProposals');
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
