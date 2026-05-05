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

    const factoryInit = await Factory.fromInit(
      deployer.address,
      CREATE_FEE,
      MINTBACK_RATE,
    );
    factory = blockchain.openContract(factoryInit);

    await deployer.getSender().send({
      to: factory.address,
      value: toNano("10"),
      init: factoryInit.init,
      bounce: false,
    });
  });

  async function deployBrand(
    owner: SandboxContract<TreasuryContract>,
    name: string,
  ): Promise<SandboxContract<BrandJetton>> {
    const result = await factory.send(
      owner.getSender(),
      { value: toNano("2") },
      {
        $$type: "CreateBrand",
        name,
        symbol: name.slice(0, 3).toUpperCase(),
        description: "",
        imageUrl: "",
      },
    );
    expect(result.transactions).toHaveTransaction({ success: true });
    const idx = (await factory.getBrandCount()) - 1n;
    const addr = await factory.getBrandAddress(idx);
    await deployer
      .getSender()
      .send({ to: addr!, value: toNano("5"), bounce: false });
    return blockchain.openContract(BrandJetton.fromAddress(addr!));
  }

  it("creates brand on sufficient fee", async () => {
    await deployBrand(brandOwner, "TestBrand");
    expect(await factory.getBrandCount()).toBe(1n);
  });

  it("rejects brand creation on insufficient fee", async () => {
    const result = await factory.send(
      brandOwner.getSender(),
      { value: toNano("0.5") },
      {
        $$type: "CreateBrand",
        name: "Cheap",
        symbol: "CHP",
        description: "",
        imageUrl: "",
      },
    );
    expect(result.transactions).toHaveTransaction({ success: false });
  });

  it("mints tokens to user (owner only)", async () => {
    const brand = await deployBrand(brandOwner, "Alpha");
    const mintResult = await brand.send(
      brandOwner.getSender(),
      { value: toNano("0.3") },
      {
        $$type: "MintTo",
        queryId: 1n,
        to: user.address,
        amount: toNano("100"),
      },
    );
    expect(mintResult.transactions).toHaveTransaction({
      on: brand.address,
      success: true,
    });

    const wallet = blockchain.openContract(
      JettonWallet.fromAddress(await brand.getWalletAddress(user.address)),
    );
    expect(await wallet.getBalance()).toBe(toNano("100"));
  });

  it("rejects mint from non-owner", async () => {
    const brand = await deployBrand(brandOwner, "Beta");
    const result = await brand.send(
      user.getSender(),
      { value: toNano("0.2") },
      { $$type: "MintTo", queryId: 1n, to: user.address, amount: toNano("50") },
    );
    expect(result.transactions).toHaveTransaction({
      on: brand.address,
      success: false,
    });
  });

  it("sets discount percent (owner only)", async () => {
    const brand = await deployBrand(brandOwner, "Gamma");
    await brand.send(
      brandOwner.getSender(),
      { value: toNano("0.05") },
      { $$type: "SetDiscountPercent", percent: 20n },
    );
    expect(await brand.getDiscountPercent()).toBe(20n);
  });

  it("rejects invalid discount percent", async () => {
    const brand = await deployBrand(brandOwner, "Delta");
    const result = await brand.send(
      brandOwner.getSender(),
      { value: toNano("0.05") },
      { $$type: "SetDiscountPercent", percent: 101n },
    );
    expect(result.transactions).toHaveTransaction({
      on: brand.address,
      success: false,
    });
  });

  async function sendPaymentWithNonce(
    brand: SandboxContract<BrandJetton>,
    buyer: SandboxContract<TreasuryContract>,
    nonce: bigint,
    queryId: bigint,
  ) {
    const wallet = blockchain.openContract(
      JettonWallet.fromAddress(await brand.getWalletAddress(buyer.address)),
    );
    return wallet.send(
      buyer.getSender(),
      { value: toNano("1") },
      {
        $$type: "TokenTransfer",
        queryId,
        amount: toNano("10"),
        destination: brand.address,
        responseDestination: buyer.address,
        customPayload: null,
        forwardTonAmount: toNano("0.3"),
        forwardPayload: beginCell()
          .storeUint(1, 8)
          .storeInt(nonce, 64)
          .endCell()
          .beginParse(),
      },
    );
  }

  it("accepts payment with fresh nonce", async () => {
    const brand = await deployBrand(brandOwner, "Epsilon");
    await brand.send(
      brandOwner.getSender(),
      { value: toNano("0.3") },
      {
        $$type: "MintTo",
        queryId: 1n,
        to: user.address,
        amount: toNano("100"),
      },
    );

    const result = await sendPaymentWithNonce(brand, user, 12345n, 2n);
    expect(result.transactions).toHaveTransaction({
      on: brand.address,
      success: true,
    });
  });

  it("rejects payment with replayed nonce", async () => {
    const brand = await deployBrand(brandOwner, "Zeta");
    await brand.send(
      brandOwner.getSender(),
      { value: toNano("0.3") },
      {
        $$type: "MintTo",
        queryId: 1n,
        to: user.address,
        amount: toNano("200"),
      },
    );

    await sendPaymentWithNonce(brand, user, 99999n, 3n);
    const replay = await sendPaymentWithNonce(brand, user, 99999n, 4n);
    expect(replay.transactions).toHaveTransaction({
      on: brand.address,
      success: false,
    });
  });

  it("swaps tokens between brands after mutual acceptance", async () => {
    const ownerA = await blockchain.treasury("ownerA");
    const ownerB = await blockchain.treasury("ownerB");

    const brandA = await deployBrand(ownerA, "Aaa");
    const brandB = await deployBrand(ownerB, "Bbb");

    await brandA.send(
      ownerA.getSender(),
      { value: toNano("0.3") },
      {
        $$type: "MintTo",
        queryId: 1n,
        to: user.address,
        amount: toNano("1000"),
      },
    );

    await brandA.send(
      ownerA.getSender(),
      { value: toNano("0.1") },
      { $$type: "ProposeRate", targetBrand: brandB.address, rate: 500n },
    );

    const acceptResult = await brandB.send(
      ownerB.getSender(),
      { value: toNano("0.2") },
      { $$type: "AcceptRate", sourceBrand: brandA.address },
    );
    expect(acceptResult.transactions).toHaveTransaction({
      on: brandA.address,
      success: true,
    });

    expect(await brandA.getSwapActive(brandB.address)).toBe(true);

    const userWalletA = blockchain.openContract(
      JettonWallet.fromAddress(await brandA.getWalletAddress(user.address)),
    );
    const swapResult = await userWalletA.send(
      user.getSender(),
      { value: toNano("1") },
      {
        $$type: "TokenTransfer",
        queryId: 5n,
        amount: toNano("100"),
        destination: brandA.address,
        responseDestination: user.address,
        customPayload: null,
        forwardTonAmount: toNano("0.5"),
        forwardPayload: beginCell()
          .storeUint(2, 8)
          .storeAddress(brandB.address)
          .endCell()
          .beginParse(),
      },
    );
    expect(swapResult.transactions).toHaveTransaction({
      on: brandA.address,
      success: true,
    });
    expect(swapResult.transactions).toHaveTransaction({
      on: brandB.address,
      success: true,
    });

    const userWalletB = blockchain.openContract(
      JettonWallet.fromAddress(await brandB.getWalletAddress(user.address)),
    );
    expect(await userWalletB.getBalance()).toBe(toNano("50"));
  });
});
