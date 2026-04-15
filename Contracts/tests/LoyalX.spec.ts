import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano, beginCell } from "@ton/core";
import { Factory } from "../build/factory/factory_Factory";
import { BrandJetton } from "../build/factory/factory_BrandJetton";
import { JettonWallet } from "../build/factory/factory_JettonWallet";
import "@ton/test-utils";

describe("LoyalX", () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let brandOwner: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let factory: SandboxContract<Factory>;

    const CREATE_FEE = toNano("1");
    const MINTBACK_RATE = 1000n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        brandOwner = await blockchain.treasury("brandOwner");
        user = await blockchain.treasury("user");

        const factoryInit = await Factory.fromInit(deployer.address, CREATE_FEE, MINTBACK_RATE);
        factory = blockchain.openContract(factoryInit);

        await deployer.getSender().send({
            to: factory.address,
            value: toNano("10"),
            init: factoryInit.init,
            bounce: false,
        });
    });

<<<<<<< HEAD
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
=======
    // Create brand via factory and top up its TON balance
    async function deployBrand(owner: SandboxContract<TreasuryContract>, name: string): Promise<SandboxContract<BrandJetton>> {
        const result = await factory.send(
            owner.getSender(),
            { value: toNano("2") },
            { $$type: "CreateBrand", name, symbol: name.slice(0, 3).toUpperCase(), description: "", imageUrl: "" }
        );
        expect(result.transactions).toHaveTransaction({ success: true });
        const idx = (await factory.getBrandCount()) - 1n;
        const addr = await factory.getBrandAddress(idx);
        // Top up brand so it can pay gas for outbound messages
        await deployer.getSender().send({ to: addr!, value: toNano("5"), bounce: false });
        return blockchain.openContract(BrandJetton.fromAddress(addr!));
    }

    // ── Factory ───────────────────────────────────────────────────────────────

    it("creates brand on sufficient fee", async () => {
        await deployBrand(brandOwner, "TestBrand");
        expect(await factory.getBrandCount()).toBe(1n);
    });

    it("rejects brand creation on insufficient fee", async () => {
        const result = await factory.send(
            brandOwner.getSender(),
            { value: toNano("0.5") },
            { $$type: "CreateBrand", name: "Cheap", symbol: "CHP", description: "", imageUrl: "" }
        );
        expect(result.transactions).toHaveTransaction({ success: false });
    });

    // ── BrandJetton ───────────────────────────────────────────────────────────

    it("mints tokens to user (owner only)", async () => {
        const brand = await deployBrand(brandOwner, "Alpha");
        const mintResult = await brand.send(
            brandOwner.getSender(),
            { value: toNano("0.3") },
            { $$type: "MintTo", queryId: 1n, to: user.address, amount: toNano("100") }
        );
        expect(mintResult.transactions).toHaveTransaction({ on: brand.address, success: true });

        const wallet = blockchain.openContract(JettonWallet.fromAddress(await brand.getWalletAddress(user.address)));
        expect(await wallet.getBalance()).toBe(toNano("100"));
    });

    it("rejects mint from non-owner", async () => {
        const brand = await deployBrand(brandOwner, "Beta");
        const result = await brand.send(
            user.getSender(),
            { value: toNano("0.2") },
            { $$type: "MintTo", queryId: 1n, to: user.address, amount: toNano("50") }
        );
        expect(result.transactions).toHaveTransaction({ on: brand.address, success: false });
    });

    it("sets discount percent (owner only)", async () => {
        const brand = await deployBrand(brandOwner, "Gamma");
        await brand.send(brandOwner.getSender(), { value: toNano("0.05") }, { $$type: "SetDiscountPercent", percent: 20n });
        expect(await brand.getDiscountPercent()).toBe(20n);
    });

    it("rejects invalid discount percent", async () => {
        const brand = await deployBrand(brandOwner, "Delta");
        const result = await brand.send(brandOwner.getSender(), { value: toNano("0.05") }, { $$type: "SetDiscountPercent", percent: 101n });
        expect(result.transactions).toHaveTransaction({ on: brand.address, success: false });
    });

    // ── QR Payment (nonce) ────────────────────────────────────────────────────

    async function sendPaymentWithNonce(brand: SandboxContract<BrandJetton>, buyer: SandboxContract<TreasuryContract>, nonce: bigint, queryId: bigint) {
        const wallet = blockchain.openContract(JettonWallet.fromAddress(await brand.getWalletAddress(buyer.address)));
        return wallet.send(
            buyer.getSender(),
            { value: toNano("1") },
>>>>>>> ebad88c (Fix: token creation and wallet page)
            {
                $$type: "TokenTransfer",
                queryId,
                amount: toNano("10"),
                destination: brand.address,
                responseDestination: buyer.address,
                customPayload: null,
                forwardTonAmount: toNano("0.3"),
                forwardPayload: beginCell().storeUint(1, 8).storeInt(nonce, 64).endCell().beginParse(),
            }
        );
    }

    it("accepts payment with fresh nonce", async () => {
        const brand = await deployBrand(brandOwner, "Epsilon");
        await brand.send(brandOwner.getSender(), { value: toNano("0.3") }, { $$type: "MintTo", queryId: 1n, to: user.address, amount: toNano("100") });

<<<<<<< HEAD
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
=======
        const result = await sendPaymentWithNonce(brand, user, 12345n, 2n);
        expect(result.transactions).toHaveTransaction({ on: brand.address, success: true });
    });
>>>>>>> ebad88c (Fix: token creation and wallet page)

    it("rejects payment with replayed nonce", async () => {
        const brand = await deployBrand(brandOwner, "Zeta");
        await brand.send(brandOwner.getSender(), { value: toNano("0.3") }, { $$type: "MintTo", queryId: 1n, to: user.address, amount: toNano("200") });

        await sendPaymentWithNonce(brand, user, 99999n, 3n);
        const replay = await sendPaymentWithNonce(brand, user, 99999n, 4n);
        expect(replay.transactions).toHaveTransaction({ on: brand.address, success: false });
    });

<<<<<<< HEAD
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
=======
    // ── Swap ──────────────────────────────────────────────────────────────────
>>>>>>> ebad88c (Fix: token creation and wallet page)

    it("swaps tokens between brands after mutual acceptance", async () => {
        const ownerA = await blockchain.treasury("ownerA");
        const ownerB = await blockchain.treasury("ownerB");

        const brandA = await deployBrand(ownerA, "Aaa");
        const brandB = await deployBrand(ownerB, "Bbb");

<<<<<<< HEAD
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
=======
        // Mint 1000 A tokens to user
        await brandA.send(ownerA.getSender(), { value: toNano("0.3") }, { $$type: "MintTo", queryId: 1n, to: user.address, amount: toNano("1000") });
>>>>>>> ebad88c (Fix: token creation and wallet page)

        // ownerA proposes: 1000 A → 500 B (rate=500 means 500/1000 ratio)
        await brandA.send(ownerA.getSender(), { value: toNano("0.1") }, { $$type: "ProposeRate", targetBrand: brandB.address, rate: 500n });

<<<<<<< HEAD
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
=======
        // ownerB accepts proposal → brandB sends RateAccepted to brandA
        const acceptResult = await brandB.send(ownerB.getSender(), { value: toNano("0.2") }, { $$type: "AcceptRate", sourceBrand: brandA.address });
        expect(acceptResult.transactions).toHaveTransaction({ on: brandA.address, success: true });
>>>>>>> ebad88c (Fix: token creation and wallet page)

        expect(await brandA.getSwapActive(brandB.address)).toBe(true);

<<<<<<< HEAD
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
=======
        // User swaps 100 A → should get 50 B (100 * 500 / 1000)
        const userWalletA = blockchain.openContract(JettonWallet.fromAddress(await brandA.getWalletAddress(user.address)));
        const swapResult = await userWalletA.send(
            user.getSender(),
            { value: toNano("1") },
            {
                $$type: "TokenTransfer",
                queryId: 5n,
                amount: toNano("100"),
                destination: brandA.address,
>>>>>>> ebad88c (Fix: token creation and wallet page)
                responseDestination: user.address,
                customPayload: null,
                forwardTonAmount: toNano("0.5"),
                forwardPayload: beginCell().storeUint(2, 8).storeAddress(brandB.address).endCell().beginParse(),
            }
        );
        expect(swapResult.transactions).toHaveTransaction({ on: brandA.address, success: true });
        expect(swapResult.transactions).toHaveTransaction({ on: brandB.address, success: true });

<<<<<<< HEAD
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
=======
        const userWalletB = blockchain.openContract(JettonWallet.fromAddress(await brandB.getWalletAddress(user.address)));
        expect(await userWalletB.getBalance()).toBe(toNano("50"));
>>>>>>> ebad88c (Fix: token creation and wallet page)
    });
});
