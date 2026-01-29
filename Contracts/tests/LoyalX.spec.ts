import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Dictionary, Address } from '@ton/core';
import { Factory } from '../wrappers/factory'; // Blueprint сам создаст эти обертки
import { BrandJetton } from '../wrappers/BrandJetton';
import { JettonWallet } from '../wrappers/JettonWallet';
import '@ton/test-utils';

describe('LoyalX System Test', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let factory: SandboxContract<Factory>;

    beforeEach(async () => {
        // 1. Запускаем локальный блокчейн
        blockchain = await Blockchain.create();
        
        // 2. Создаем богатые кошельки для тестов (Deployer - админ, User - клиент)
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        // 3. Деплоим Фабрику
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
        // --- ШАГ 1: Создаем Бренд А (Кофейня) ---
        const createResultA = await factory.send(
            deployer.getSender(),
            { value: toNano('1') }, // Платим за газ для деплоя нового контракта
            {
                $$type: 'CreateBrand',
                brandName: 'Coffee Coin',
                ticker: 'COF',
                content: null // Упрощаем для теста
            }
        );

        // Проверяем, что фабрика ответила и создала бренд
        expect(createResultA.transactions).toHaveTransaction({
            from: factory.address,
            to: deployer.address,
            op: 0x0 /* BrandCreated id */, 
            success: true
        });

        // Получаем адрес созданного контракта (нужно знать формулу, но для теста возьмем из событий или пересчитаем)
        // В реальном тесте Blueprint мы можем вычислить адрес:
        const brandA_Address = await factory.getGetWalletAddress(deployer.address); // Тут нужна логика вычисления, для упрощения допустим мы его знаем
        // ПРИМЕЧАНИЕ: Чтобы тест работал точно, давай получим адрес через метод контракта, 
        // но так как в Фабрике мы не сделали геттер для адреса, 
        // мы вычислим его на клиенте так же, как в контракте:
        const brandA_Init = await BrandJetton.init(deployer.address, 'COF', 'Coffee Coin', null);
        const brandA = blockchain.openContract(BrandJetton.createFromConfig({
             owner: deployer.address,
             symbol: 'COF',
             name: 'Coffee Coin',
             content: null
        }, BrandJetton.code)); // Тут псевдокод инициализации, Blueprint сам подскажет типы
        
        // --- ШАГ 2: Создаем Бренд Б (Бургерная) ---
        // (Аналогично создаем второй бренд, назовем его brandB)
        const brandB_Init = await BrandJetton.init(deployer.address, 'BRG', 'Burger Coin', null);
        const brandB = blockchain.openContract(BrandJetton.createFromConfig({
             owner: deployer.address,
             symbol: 'BRG',
             name: 'Burger Coin',
             content: null
        }, BrandJetton.code));

        // --- ШАГ 3: Начисляем User'у 100 монет COF ---
        // От имени владельца (deployer) зовем Mint у бренда А
        await brandA.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            'Mint' // Текстовое сообщение, которое мы прописали в контракте
        );
        
        // Проверяем баланс User'а
        // Для этого нужно получить адрес кошелька юзера для Бренда А
        const userWalletA_Address = await brandA.getGetWalletAddress(user.address);
        const userWalletA = blockchain.openContract(JettonWallet.fromAddress(userWalletA_Address));
        
        const walletData = await userWalletA.getGetWalletData();
        console.log('User Balance COF:', walletData.balance);
        expect(walletData.balance).toBeGreaterThan(0n);

        // --- ШАГ 4: Сценарий ОБМЕНА (Самое интересное) ---
        
        // 1. Бургерная (Brand B) говорит: "Я готов принимать кошелек COF по курсу 2 к 1"
        // Нам нужно узнать адрес кошелька COF, который будет слать деньги. 
        // В нашем коде мы проверяем sender. Sender'ом будет кошелек юзера.
        await brandB.send(
            deployer.getSender(), // Владелец Бургерной
            { value: toNano('0.05') },
            {
                $$type: 'SetExchangeRate',
                jettonWalletAddress: userWalletA_Address, // Разрешаем этому кошельку слать нам
                rate: 2n // За 1 COF даем 2 Burger
            }
        );

        // 2. Юзер отправляет свои COF на адрес Мастера Бургерной
        await userWalletA.send(
            user.getSender(),
            { value: toNano('1') }, // Газ на все пересылки
            {
                $$type: 'Transfer',
                query_id: 0n,
                amount: toNano('10'), // Меняем 10 монет
                destination: brandB.address, // Шлем на адрес Мастера Бургерной!
                response_destination: user.address,
                custom_payload: null,
                forward_ton_amount: toNano('0.5'), // ВАЖНО! >0 чтобы пришло уведомление
                forward_payload: null
            }
        );

        // 3. Проверяем, что у Юзера появились Бургер-коины (Brand B)
        const userWalletB_Address = await brandB.getGetWalletAddress(user.address);
        const userWalletB = blockchain.openContract(JettonWallet.fromAddress(userWalletB_Address));
        
        const walletB_Data = await userWalletB.getGetWalletData();
        console.log('User Balance BURGER:', walletB_Data.balance);
        
        // Если курс 2 к 1, и мы отдали 10, должны получить 20
        // (с учетом децималов, если они одинаковые)
        expect(walletB_Data.balance).toEqual(toNano('20')); 
    });
});
