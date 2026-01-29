import "@stdlib/deploy";
import "./brand_jetton";

message CreateBrand {
    brandName: String;
    ticker: String;
    content: Cell; 
}

message BrandCreated {
    brandId: Int as uint32;
    brandAddress: Address;
    owner: Address;
}

contract Factory with Deployable {
    nextBrandId: Int as uint32;
    owner: Address;

    init() {
        self.nextBrandId = 0;
        self.owner = sender();
    }

    receive(msg: CreateBrand) {
        let currentId: Int = self.nextBrandId;
        self.nextBrandId += 1;
        let brandInit: StateInit = initOf BrandJetton(sender(), msg.ticker, msg.brandName, msg.content);
        let brandAddress: Address = contractAddress(brandInit);
        deploy(brandInit, null);
        self.reply(BrandCreated{
            brandId: currentId,
            brandAddress: brandAddress,
            owner: sender()
        }.toCell());
    }

    get fun numBrands(): Int {
        return self.nextBrandId;
    }
}
