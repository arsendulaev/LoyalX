import "./messages.tact";
import "./brand_jetton.tact";

contract Factory {
    owner: Address;
    createFee: Int as coins;
    mintbackRate: Int as uint64;
    brandCount: Int as uint64 = 0;
    brands: map<Int, Address>;

    init(owner: Address, createFee: Int, mintbackRate: Int) {
        self.owner = owner;
        self.createFee = createFee;
        self.mintbackRate = mintbackRate;
    }

    receive() {}

    receive(msg: CreateBrand) {
        let ctx: Context = context();
        require(ctx.value >= self.createFee, "Insufficient fee");
        let brandInit: StateInit = initOf BrandJetton(
            ctx.sender,
            myAddress(),
            msg.name,
            msg.symbol,
            msg.description,
            msg.imageUrl,
        );
        let brandAddr: Address = contractAddress(brandInit);

        send(SendParameters {
            to: brandAddr,
            value: ton("0.1"),
            bounce: false,
            mode: SendPayGasSeparately,
            code: brandInit.code,
            data: brandInit.data,
            body: emptyCell(),
        });

        let mintbackAmount: Int = (ctx.value * self.mintbackRate) / ton("1");
        if (mintbackAmount > 0) {
            send(SendParameters {
                to: brandAddr,
                value: ton("0.15"),
                bounce: false,
                mode: SendPayGasSeparately,
                body: MintTo {
                    queryId: 0,
                    to: ctx.sender,
                    amount: mintbackAmount,
                }.toCell(),
            });
        }
        self.brands.set(self.brandCount, brandAddr);
        self.brandCount += 1;
    }

    receive(msg: SetCreateFee) {
        require(context().sender == self.owner, "Only owner");
        self.createFee = msg.fee;
    }

    receive(msg: SetMintbackRate) {
        require(context().sender == self.owner, "Only owner");
        self.mintbackRate = msg.rate;
    }

    receive("withdraw") {
        require(context().sender == self.owner, "Only owner");
        send(SendParameters {
            to: self.owner,
            value: 0,
            bounce: false,
            mode: SendRemainingBalance,
        });
    }

    get fun createFee(): Int {
        return self.createFee;
    }

    get fun mintbackRate(): Int {
        return self.mintbackRate;
    }

    get fun brandCount(): Int {
        return self.brandCount;
    }

    get fun brandAddress(index: Int): Address? {
        return self.brands.get(index);
    }
}
