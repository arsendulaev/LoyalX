import "@stdlib/deploy";
import "./brand_jetton"; // Импортируем наш контракт жетона

// Твои сообщения
message CreateBrand {
    brandName: String;
    ticker: String;
    // Добавим поле для ссылки на логотип, чтобы соответствовать ТЗ (метаданные)
    content: Cell; 
}

message BrandCreated {
    brandId: Int as uint32;
    brandAddress: Address; // Важно вернуть адрес созданного жетона
    owner: Address;
}

contract Factory with Deployable {
    nextBrandId: Int as uint32;
    owner: Address;
    brands: map<Int, Address>;

    init() {
        self.nextBrandId = 0;
        self.owner = sender();
    }

    receive(msg: CreateBrand) {
        let currentId: Int = self.nextBrandId;
        self.nextBrandId += 1;

        let brandInit: StateInit = initOf BrandJetton(sender(), msg.ticker, msg.brandName, msg.content);
        let brandAddress: Address = contractAddress(brandInit);

        // сохраняем адрес чтобы фронтенд мог получить список брендов
        self.brands.set(currentId, brandAddress);

        send(SendParameters{
            to: brandAddress,
            value: ton("0.15"),
            bounce: false,
            body: Deploy{ queryId: 0 }.toCell(),
            code: brandInit.code,
            data: brandInit.data
        });
        
        emit(BrandCreated{
            brandId: currentId,
            brandAddress: brandAddress,
            owner: sender()
        }.toCell());
    }

    get fun numBrands(): Int {
        return self.nextBrandId;
    }

    get fun brandAddress(id: Int): Address? {
        return self.brands.get(id);
    }
}
