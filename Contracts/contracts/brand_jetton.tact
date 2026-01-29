import "@stdlib/deploy";
import "@stdlib/ownable";
import "./jetton_wallet";

// --- Сообщения (интерфейсы) ---

// Управление курсами (только для владельца)
message SetExchangeRate {
    jettonWalletAddress: Address; // Адрес кошелька токена, который мы готовы принимать
    rate: Int as uint32;
}

// --- Контракт ---

contract BrandJetton with Deployable, Ownable {
    owner: Address;
    symbol: String;
    name: String;
    content: Cell;
    totalSupply: Int as coins;
    mintable: Bool;

    // Храним курсы обмена: [Адрес_Кошелька_Входящего_Токена] -> [Курс]
    exchangeRates: map<Address, Int>;

    init(owner: Address, symbol: String, name: String, content: Cell) {
        self.owner = owner;
        self.symbol = symbol;
        self.name = name;
        self.content = content;
        self.totalSupply = 0;
        self.mintable = true;
    }

    // 1. МИНТИНГ (Эмиссия баллов)
    // Владелец может просто начислить баллы себе или клиенту
    receive("Mint") {
        let ctx: Context = context();
        self.requireOwner();
        self.mint(ctx.sender, ton("100"), ctx.sender); // Начисляем 100 баллов владельцу
    }

    // 2. ОБМЕН (SWAP)
    // Когда сюда приходят чужие жетоны, срабатывает это уведомление
    receive(msg: TransferNotification) {
        // msg.sender - это адрес кошелька, ОТ КОТОРОГО пришли деньги
        // Проверяем, есть ли такой кошелек в нашем списке разрешенных для обмена
        let rate: Int? = self.exchangeRates.get(msg.sender);

        if (rate != null) {
            // Математика обмена
            let amountToMint: Int = msg.amount * rate!!;
            
            // msg.sender в уведомлении (в поле sender) - это Изначальный Владелец (User)
            // msg.sender (контекст) - это контракт кошелька
            
            // ВНИМАНИЕ: В TransferNotification поле `sender` - это тот, кто инициировал перевод (User).
            // Мы начисляем наши новые баллы именно ему.
            self.mint(msg.sender, amountToMint, msg.sender);
        }
    }

    // 3. УСТАНОВКА КУРСА
    receive(msg: SetExchangeRate) {
        self.requireOwner();
        self.exchangeRates.set(msg.jettonWalletAddress, msg.rate);
    }

    // --- ПРИВАТНАЯ ФУНКЦИЯ (СЕРДЦЕ СИСТЕМЫ) ---
    // Она вычисляет адрес кошелька и отправляет туда команду "Зачислить" + Код контракта
    fun mint(to: Address, amount: Int, response_destination: Address) {
        self.totalSupply += amount;
        
        // Магия Blueprint: вычисляем StateInit (Код + Данные) будущего кошелька
        let winit: StateInit = initOf JettonWallet(to, myAddress());
        
        send(SendParameters{
            to: contractAddress(winit), // Вычисляем адрес, где должен жить кошелек
            value: 0, 
            bounce: true,
            mode: SendRemainingValue, // Отправляем весь оставшийся газ
            body: InternalTransfer{ 
                queryId: 0,
                amount: amount,
                from: myAddress(),
                responseDestination: responseDestination,
                forwardTonAmount: 0,
                forwardPayload: emptySlice()
            }.toCell(),
            code: winit.code, // <-- ВАЖНО: Прикладываем код кошелька
            data: winit.data  // <-- ВАЖНО: Прикладываем данные инициализации
        });
    }

    // --- TEP-74 GETTERS (Обязательные для кошельков и фронтенда) ---

    get fun get_jetton_data(): JettonData {
        return JettonData{ 
            totalSupply: self.totalSupply, 
            mintable: self.mintable, 
            admin: self.owner, 
            content: self.content, 
            walletCode: initOf JettonWallet(self.owner, myAddress()).code // Отдаем код кошелька миру
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        let winit: StateInit = initOf JettonWallet(owner, myAddress());
        return contractAddress(winit);
    }
}

// Структура для геттера
struct JettonData {
    totalSupply: Int;
    mintable: Bool;
    admin: Address;
    content: Cell;
    walletCode: Cell;
}
