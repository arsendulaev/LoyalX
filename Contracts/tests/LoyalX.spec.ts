import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import { Factory } from '../wrappers/factory';
import { BrandJetton } from '../wrappers/BrandJetton';
import { JettonWallet } from '../wrappers/JettonWallet';
import '@ton/test-utils';

describe('LoyalX System Test', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let factory: SandboxContract<Factory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        factory = blockchain.openContract(await Factory.fromInit());

        const deployResult = await factory.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            success: true,
        });
    });

    it('should create brands, mint tokens and SWAP them', async () => {
        const createResultA = await factory.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'CreateBrand',
                brandName: 'Coffee Coin',
                ticker: 'COF',
                content: null
            }
        );

        expect(createResultA.transactions).toHaveTransaction({
            from: factory.address,
            to: deployer.address,
            success: true
        });

        const brandA = blockchain.openContract(
            await BrandJetton.fromInit(deployer.address, 'COF', 'Coffee Coin', null)
        );
        await factory.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'CreateBrand',
                brandName: 'Burger Coin',
                ticker: 'BRG',
                content: null
            }
        );

        const brandB = blockchain.openContract(
            await BrandJetton.fromInit(deployer.address, 'BRG', 'Burger Coin', null)
        );
        await brandA.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            'Mint' 
        );
        const userWalletA_Address = await brandA.getGetWalletAddress(user.address);
        const userWalletA = blockchain.openContract(JettonWallet.fromAddress(userWalletA_Address));
        const walletData = await userWalletA.getGetWalletData();
        console.log('User Balance COF (Before Swap):', walletData.balance);
        expect(walletData.balance).toEqual(toNano('100'));
        
        const brandB_WalletForA_Address = await brandA.getGetWalletAddress(brandB.address);

        console.log('Brand B Wallet for COF Address:', brandB_WalletForA_Address);
        await brandB.send(
            deployer.getSender(),
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetExchangeRate',
                jettonWalletAddress: brandB_WalletForA_Address,
                rate: 2n
            }
        );
        const swapResult = await userWalletA.send(
            user.getSender(),
            { value: toNano('1') },
            {
                $$type: 'Transfer',
                queryId: 0n,
                amount: toNano('10'),
                destination: brandB.address,
                responseDestination: user.address,
                customPayload: null,
                forwardTonAmount: toNano('0.6'),
                forwardPayload: null
            }
        );
        expect(swapResult.transactions).toHaveTransaction({
            from: userWalletA.address,
            to: brandB_WalletForA_Address,
            success: true
        });
        const userWalletB_Address = await brandB.getGetWalletAddress(user.address);
        const userWalletB = blockchain.openContract(JettonWallet.fromAddress(userWalletB_Address));
        const walletB_Data = await userWalletB.getGetWalletData();
        console.log('User Balance BURGER (After Swap):', walletB_Data.balance);
        expect(walletB_Data.balance).toEqual(toNano('20'));
    });
});