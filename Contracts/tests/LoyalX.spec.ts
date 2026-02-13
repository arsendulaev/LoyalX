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

<<<<<<< HEAD
    it('should create brands, mint tokens and SWAP them', async () => {
        const emptyContent = beginCell().endCell();
=======
    it('should create brands, mint tokens and check balances', async () => {
        // ============================================================
        // ШАГ 1: Создаем Бренд А (Coffee Coin)
        // ============================================================
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
        const createResultA = await factory.send(
            deployer.getSender(),
            { value: toNano('0.4') },
            {
                $$type: 'CreateBrand',
                name: 'Coffee Coin',
                symbol: 'COF',
                description: 'Coffee loyalty program',
                image: 'https://example.com/coffee.png',
            }
        );

        expect(createResultA.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            success: true
        });

<<<<<<< HEAD
=======
        // Вычисляем адрес контракта Brand A через fromInit
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
        const brandA = blockchain.openContract(
            await BrandJetton.fromInit(
                deployer.address,
                'Coffee Coin',
                'COF',
                'Coffee loyalty program',
                'https://example.com/coffee.png'
            )
        );
<<<<<<< HEAD
        await factory.send(
=======

        // Проверяем что бренд задеплоился
        expect(createResultA.transactions).toHaveTransaction({
            from: factory.address,
            to: brandA.address,
            success: true,
            deploy: true,
        });

        // Проверяем геттер
        const brandData = await brandA.getGetJettonData();
        expect(brandData.name).toBe('Coffee Coin');
        expect(brandData.symbol).toBe('COF');
        expect(brandData.admin).toEqualAddress(deployer.address);

        // ============================================================
        // ШАГ 2: Создаем Бренд Б (Burger Coin)
        // ============================================================
        const createResultB = await factory.send(
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
            deployer.getSender(),
            { value: toNano('0.4') },
            {
                $$type: 'CreateBrand',
                name: 'Burger Coin',
                symbol: 'BRG',
                description: 'Burger loyalty program',
                image: 'https://example.com/burger.png',
            }
        );

        expect(createResultB.transactions).toHaveTransaction({
            from: deployer.address,
            to: factory.address,
            success: true
        });

        const brandB = blockchain.openContract(
            await BrandJetton.fromInit(
                deployer.address,
                'Burger Coin',
                'BRG',
                'Burger loyalty program',
                'https://example.com/burger.png'
            )
        );

<<<<<<< HEAD
        const mintResult = await brandA.send(
            deployer.getSender(),
            { value: toNano('2') },
=======
        expect(createResultB.transactions).toHaveTransaction({
            from: factory.address,
            to: brandB.address,
            success: true,
            deploy: true,
        });

        // Проверяем что фабрика знает про 2 бренда
        const numBrands = await factory.getNumBrands();
        expect(numBrands).toBe(2n);

        // ============================================================
        // ШАГ 3: Начисляем User'у 100 монет COF
        // ============================================================
        const mintResult = await brandA.send(
            deployer.getSender(),
            { value: toNano('0.3') },
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
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

<<<<<<< HEAD
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
=======
        // Проверяем что кошелёк создан и баланс правильный
        const userWalletA_Address = await brandA.getGetWalletAddress(user.address);
        const userWalletA = blockchain.openContract(JettonWallet.fromAddress(userWalletA_Address));

        const walletData = await userWalletA.getGetWalletData();
        expect(walletData.balance).toBe(toNano('100'));
        expect(walletData.owner).toEqualAddress(user.address);
        expect(walletData.master).toEqualAddress(brandA.address);

        // Проверяем total supply
        const updatedData = await brandA.getGetJettonData();
        expect(updatedData.totalSupply).toBe(toNano('100'));

        // ============================================================
        // ШАГ 4: Сценарий ОБМЕНА (SWAP)
        // ============================================================
        const brandB_WalletForA_Address = await brandA.getGetWalletAddress(brandB.address);

        // Устанавливаем курс: 1 COF = 2 BRG
        // Используем master address (brandB.address), а не wallet address
        const rateResult = await brandB.send(
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
            deployer.getSender(),
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetExchangeRate',
<<<<<<< HEAD
                jettonWalletAddress: brandB_WalletForA_Address,
                rate: 2n
            }
        );
        const swapResult = await userWalletA.send(
            user.getSender(),
            { value: toNano('1') },
=======
                jettonMasterAddress: brandA.address,
                rate: 2n
            }
        );

        expect(rateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: brandB.address,
            success: true
        });

        // Запоминаем totalSupply Brand B до обмена
        const brandBSupplyBefore = (await brandB.getGetJettonData()).totalSupply;

        // Вычисляем адрес кошелька пользователя для brandB (нужен до swap)
        const userWalletB_Address = await brandB.getGetWalletAddress(user.address);

        // Переводим 10 COF на кошелек пользователя для brandB (swap)
        // destination = userWalletB (мастер = brandB), поэтому TransferNotification придет в brandB
        // forwardPayload содержит master address (brandA.address) для идентификации исходного jetton
        const swapResult = await userWalletA.send(
            user.getSender(),
            { value: toNano('3') },
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
            {
                $$type: 'Transfer',
                queryId: 0n,
                amount: toNano('10'),
<<<<<<< HEAD
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
=======
                destination: userWalletB_Address,
                responseDestination: user.address,
                customPayload: null,
                forwardTonAmount: toNano('2'),
                forwardPayload: beginCell().storeAddress(brandA.address).endCell().asSlice()
            }
        );

        expect(swapResult.transactions).toHaveTransaction({
            from: userWalletA.address,
            to: brandB_WalletForA_Address,
            success: true
        });

        console.log('=== SWAP TRANSACTIONS ===');
        for (let i = 0; i < swapResult.transactions.length; i++) {
            const tx = swapResult.transactions[i];
            const desc = tx.description as any;
            const success = desc.aborted === false;
            const toAddr = desc.account?.toString() || '?';
            console.log(`  [${i}] type=${desc.type} to=${toAddr} success=${success} aborted=${desc.aborted}`);
            if (desc.computePhase?.type === 'vm') {
                console.log(`       exitCode=${desc.computePhase.exitCode}`);
            }
            if (desc.actionPhase?.type === 'action') {
                console.log(`       actionResultCode=${desc.actionPhase.resultCode}`);
            }
        }
        console.log('=========================');

        // ============================================================
        // ШАГ 5: Проверка результатов обмена
        // ============================================================
        // User должен получить 20 BRG (10 COF * 2)
        const userWalletB = blockchain.openContract(JettonWallet.fromAddress(userWalletB_Address));

        const walletBData = await userWalletB.getGetWalletData();
        expect(walletBData.balance).toBe(toNano('20'));

        // User должен остаться с 90 COF (100 - 10)
        const walletADataAfter = await userWalletA.getGetWalletData();
        expect(walletADataAfter.balance).toBe(toNano('90'));

        // Проверяем что COF totalSupply уменьшился на сожжённую сумму
        const brandASupplyAfter = (await brandA.getGetJettonData()).totalSupply;
        expect(brandASupplyAfter).toBe(toNano('90'));

        // Проверяем что BRG totalSupply увеличился на minted amount
        const brandBSupplyAfter = (await brandB.getGetJettonData()).totalSupply;
        expect(brandBSupplyAfter).toBe(brandBSupplyBefore + toNano('20'));

        console.log('All tests passed!');
>>>>>>> 7e73c96 (fix: compilation error in brand_jetton.tact and improve swap logic)
    });
});
