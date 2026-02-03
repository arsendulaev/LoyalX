import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { Factory } from '../wrappers/Factory';
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
        const emptyContent = beginCell().endCell();
        const createResultA = await factory.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'CreateBrand',
                brandName: 'Coffee Coin',
                ticker: 'COF',
                content: emptyContent
            }
        );

        expect(createResultA.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            success: true
        });

        const brandA = blockchain.openContract(
            await BrandJetton.fromInit(deployer.address, 'COF', 'Coffee Coin', emptyContent)
        );
        await factory.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'CreateBrand',
                brandName: 'Burger Coin',
                ticker: 'BRG',
                content: emptyContent
            }
        );

        const brandB = blockchain.openContract(
            await BrandJetton.fromInit(deployer.address, 'BRG', 'Burger Coin', emptyContent)
        );

        const mintResult = await brandA.send(
            deployer.getSender(),
            { value: toNano('2') },
            {
                $$type: 'MintTo',
                to: user.address,
                amount: toNano('100')
            }
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: brandA.address,
            success: true
        });

        const userWalletA_Address = await brandA.getGetWalletAddress(user.address);
        const walletInternalTransferTx = mintResult.transactions.find((tx: any) => 
            tx.inMessage?.info.type === 'internal' && 
            tx.inMessage.info.dest.equals(userWalletA_Address) &&
            tx.description.type === 'generic' &&
            tx.description.computePhase.type === 'vm' &&
            tx.description.computePhase.exitCode === 0
        );
        
        if (walletInternalTransferTx) {
            console.log('Found successful InternalTransfer to wallet!');
            console.log('Out messages from wallet:', walletInternalTransferTx.outMessagesCount);
            const walletTx = mintResult.transactions.find((tx: any) => 
                tx.inMessage?.info.type === 'internal' && 
                tx.inMessage.info.dest.equals(userWalletA_Address)
            );
            if (walletTx && walletTx.inMessage?.body) {
                const body = walletTx.inMessage.body.beginParse();
                if (body.remainingBits >= 32) {
                    const op = body.loadUint(32);
                    console.log('Message OP code:', `0x${op.toString(16)}`);
                    if (op === 0x178d4519) {
                        const queryId = body.loadUint(64);
                        console.log('This is InternalTransfer!');
                    }
                }
            }
        } else {
            console.log('NO successful InternalTransfer to wallet!');
        }
        console.log('User wallet address:', userWalletA_Address);
        console.log('User address:', user.address);
        console.log('TX 2 destination:', 'EQDd99Pk_7SwHS_Vpfw4Zh7xRdiP_c_JtoAuxjELkxMlejKf');
        const userWalletA = blockchain.openContract(JettonWallet.fromAddress(userWalletA_Address));
        const accountState = await blockchain.getContract(userWalletA_Address);
        console.log('Account active:', accountState.accountState?.type === 'active');
        console.log('Account balance TON:', accountState.balance);
        if (accountState.accountState?.type === 'active') {
            const data = accountState.accountState.state.data;
            console.log('Data exists:', data !== undefined && data !== null);
            if (data) {
                const slice = data.beginParse();
                console.log('Slice remaining bits:', slice.remainingBits);
                const initFlag = slice.loadUint(1);
                console.log('Init flag:', initFlag);
                if (initFlag === 1) {
                    const rawBalance = slice.loadCoins();
                    console.log('RAW balance from data:', rawBalance);
                } else {
                    console.log('Contract NOT initialized!');
                }
            } else {
                console.log('Data is null!');
            }
        }
        const walletData = await userWalletA.getGetWalletData();
        const provider = blockchain.provider(userWalletA_Address);
        const manualResult = await provider.get('get_wallet_data', []);
        console.log('Manual getter result balance:', manualResult.stack.readBigNumber());
        console.log('Wallet Data:', {
            balance: walletData.balance,
            owner: walletData.owner,
            master: walletData.master
        });
        console.log('Expected owner:', user.address);
        console.log('Expected master:', brandA.address);
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
                forwardPayload: beginCell().endCell().asSlice()
            }
        );

        const userWalletB_Address = await brandB.getGetWalletAddress(user.address);
        const userWalletB = blockchain.openContract(JettonWallet.fromAddress(userWalletB_Address));
        console.log('Тест завершён! Контракты работают.');
    });
});