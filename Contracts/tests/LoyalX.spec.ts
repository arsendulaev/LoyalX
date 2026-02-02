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
        // ============================================================
        // ШАГ 1: Создаем Бренд А (Coffee Coin)
        // ============================================================
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

        // Вычисляем адрес контракта Brand A (так же, как это делает фабрика)
        // Примечание: В реальном бою лучше парсить ответ фабрики, но для теста ре-инит допустим
        const brandA = blockchain.openContract(
            await BrandJetton.fromInit(deployer.address, 'COF', 'Coffee Coin', null)
        );

        // ============================================================
        // ШАГ 2: Создаем Бренд Б (Burger Coin)
        // ============================================================
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

        // ============================================================
        // ШАГ 3: Начисляем User'у 100 монет COF
        // ============================================================
        await brandA.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            'Mint' 
        );

        // Получаем адрес кошелька Юзера в системе COF (Brand A)
        const userWalletA_Address = await brandA.getGetWalletAddress(user.address);
        const userWalletA = blockchain.openContract(JettonWallet.fromAddress(userWalletA_Address));

        // Проверяем баланс
        const walletData = await userWalletA.getGetWalletData();
        console.log('User Balance COF (Before Swap):', walletData.balance);
        expect(walletData.balance).toEqual(toNano('100'));

        // ============================================================
        // ШАГ 4: Сценарий ОБМЕНА (SWAP)
        // ============================================================
        
        // 1. Подготовка: Узнаем адрес кошелька Бренда Б внутри системы Бренда А.
        // Почему это важно? Когда Юзер отправит COF Бренду Б, монеты упадут на этот кошелек.
        // И именно ЭТОТ кошелек пришлет уведомление "TransferNotification" Бренду Б.
        const brandB_WalletForA_Address = await brandA.getGetWalletAddress(brandB.address);

        console.log('Brand B Wallet for COF Address:', brandB_WalletForA_Address);

        // 2. Настройка курса: Бренд Б разрешает входящие переводы от СВОЕГО кошелька COF
        await brandB.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetExchangeRate',
                jettonWalletAddress: brandB_WalletForA_Address, // <--- ВАЖНО: Разрешаем наш кошелек-приемник
                rate: 2n // Курс: 1 COF = 2 BRG
            }
        );

        // 3. Перевод: Юзер отправляет 10 COF на адрес контракта Brand B
        const swapResult = await userWalletA.send(
            user.getSender(),
            { value: toNano('1') }, // Газа должно быть достаточно для цепочки транзакций
            {
                $$type: 'Transfer',
                queryId: 0n, // В исправленном коде это поле queryId (camelCase)
                amount: toNano('10'),
                destination: brandB.address, // Получатель - Мастер контракта Бренда Б
                responseDestination: user.address,
                customPayload: null,
                forwardTonAmount: toNano('0.6'), // > 0, чтобы сработало уведомление
                forwardPayload: null
            }
        );

        // Проверяем, что транзакция прошла успешно
        expect(swapResult.transactions).toHaveTransaction({
            from: userWalletA.address,
            to: brandB_WalletForA_Address, // Деньги пришли на кошелек Бренда Б
            success: true
        });

        // ============================================================
        // ШАГ 5: Проверка результата
        // ============================================================

        // Проверяем баланс Юзера в Бренде Б (Burger Coin)
        const userWalletB_Address = await brandB.getGetWalletAddress(user.address);
        const userWalletB = blockchain.openContract(JettonWallet.fromAddress(userWalletB_Address));
        
        const walletB_Data = await userWalletB.getGetWalletData();
        console.log('User Balance BURGER (After Swap):', walletB_Data.balance);
        
        // Было 10 COF, курс 2 -> Должно стать 20 BRG
        expect(walletB_Data.balance).toEqual(toNano('20'));
    });
});