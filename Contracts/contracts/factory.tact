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

    init() {
        self.nextBrandId = 0;
        self.owner = sender();
    }

    receive(msg: CreateBrand) {
        // 1. Берем текущий ID для ответа и увеличиваем счетчик
        let currentId: Int = self.nextBrandId;
        self.nextBrandId += 1;

        // 2. Создание нового контракта
        // Мы вычисляем "чертеж" (StateInit) будущего жетона.
        // Передаем отправителя (бизнеса) как владельца его собственной программы лояльности.
        let brandInit: StateInit = initOf BrandJetton(sender(), msg.ticker, msg.brandName, msg.content);
        let brandAddress: Address = contractAddress(brandInit);

        // 3. Отправляем сообщение на деплой
        // Оставляем немного газа для операций Factory
        send(SendParameters{
            to: brandAddress,
            value: ton("0.15"), // Фиксированная сумма для деплоя
            bounce: false,
            body: Deploy{ queryId: 0 }.toCell(),
            code: brandInit.code,
            data: brandInit.data
        });
        
        // 4. Emit события создания бренда
        emit(BrandCreated{
            brandId: currentId,
            brandAddress: brandAddress,
            owner: sender()
        }.toCell());
    }

    get fun numBrands(): Int {
        return self.nextBrandId;
    }
}
