import "@stdlib/deploy";
import "./messages.tact";
import "./brand_jetton.tact";

contract Factory with Deployable {
    nextBrandId: Int as uint32;
    owner: Address;
    brands: map<Int, Address>;

    init() {
        self.nextBrandId = 0;
        self.owner = sender();
    }

    receive(msg: CreateBrand) {
        let ctx: Context = context();
        let currentId: Int = self.nextBrandId;
        self.nextBrandId += 1;

        let brandInit: StateInit = initOf BrandJetton(ctx.sender, msg.name, msg.symbol, msg.description, msg.image);
        let brandAddress: Address = contractAddress(brandInit);

        self.brands.set(currentId, brandAddress);

        send(SendParameters{
            to: brandAddress,
            value: ton("0.25"),
            bounce: false,
            body: Deploy{ queryId: 0 }.toCell(),
            code: brandInit.code,
            data: brandInit.data
        });

        emit(BrandCreated{
            brandId: currentId,
            brandAddress: brandAddress,
            owner: ctx.sender
        }.toCell());
    }

    get fun numBrands(): Int {
        return self.nextBrandId;
    }

    get fun brandAddress(id: Int): Address? {
        return self.brands.get(id);
    }
}