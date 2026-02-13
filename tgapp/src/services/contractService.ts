import { Address, toNano, beginCell } from '@ton/core';
import { TonClient } from '@ton/ton';
import { Factory } from '../contracts/Factory';
import { BrandJetton } from '../contracts/BrandJetton';
import { JettonWallet } from '../contracts/JettonWallet';
import type { CreateBrand } from '../contracts/Factory';
import type { MintTo } from '../contracts/BrandJetton';
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

  async getAllBrands(): Promise<Address[]> {
    const factory = await this.getFactory();
    const brands: Address[] = [];
    
    try {
      const brandCount = await factory.getNumBrands();
      console.log('Total brands:', brandCount);
    } catch (error) {
      console.error('Error fetching brands:', error);
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
      console.error('Error fetching brand info:', error);
      return null;
    }
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
    } catch (error) {
      console.error('Error fetching user balance:', error);
      return 0n;
    }
  }

  async getUserBalances(userAddress: Address): Promise<{ brand: Address; balance: bigint }[]> {
    const brands = await this.getAllBrands();
    const balances: { brand: Address; balance: bigint }[] = [];

    for (const brand of brands) {
      const balance = await this.getUserBalance(brand, userAddress);
      if (balance > 0n) {
        balances.push({ brand, balance });
      }
    }

    return balances;
  }

  async createBrandMessage(params: {
    name: string;
    description: string;
    symbol: string;
    image: string;
  }) {
    const content = beginCell()
      .storeUint(0x01, 8)
      .storeStringTail(
        JSON.stringify({
          name: params.name,
          description: params.description,
          symbol: params.symbol,
          image: params.image,
        })
      )
      .endCell();

    const factory = await this.getFactory();
    
    const message: CreateBrand = {
      $$type: 'CreateBrand',
      brandName: params.name,
      ticker: params.symbol,
      content: content,
    };

    return {
      factory,
      message,
      value: toNano('0.5'),
    };
  }

  async createMintMessage(params: {
    brandAddress: Address;
    to: Address;
    amount: bigint;
  }) {
    const brand = this.client.open(BrandJetton.fromAddress(params.brandAddress));
    
    const message: MintTo = {
      $$type: 'MintTo',
      to: params.to,
      amount: params.amount,
    };

    return {
      brand,
      message,
      value: toNano('0.1'),
    };
  }

  async createSwapMessage(params: {
    fromBrandAddress: Address;
    toBrandAddress: Address;
    amount: bigint;
    userAddress: Address;
  }) {
    const walletAddress = await this.getUserWalletAddress(params.fromBrandAddress, params.userAddress);
    const wallet = this.client.open(JettonWallet.fromAddress(walletAddress));
    
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
      wallet,
      message,
      value: toNano('0.2'),
    };
  }
}
