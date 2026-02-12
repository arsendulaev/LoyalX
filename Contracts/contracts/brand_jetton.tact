import "@stdlib/deploy";
import "@stdlib/ownable";
import "./jetton_wallet";

// --- Сообщения (интерфейсы) ---

// Управление курсами (только для владельца)
message SetExchangeRate {
    jettonWalletAddress: Address; // Адрес кошелька токена, который мы готовы принимать
    rate: Int as uint32;
}

// Минтинг токенов для конкретного адреса
message MintTo {
    to: Address;
    amount: Int as coins;
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
    // Владелец может просто начислить баллы себе
    receive("Mint") {
        let ctx: Context = context();
        self.requireOwner();
        self.mint(ctx.sender, ton("100"), ctx.sender); // Начисляем 100 баллов владельцу
    }

    // Минтинг для конкретного адреса
    receive(msg: MintTo) {
        self.requireOwner();
        self.mint(msg.to, msg.amount, msg.to);
    }

    // 2. ОБМЕН (SWAP)
    receive(msg: TransferNotification) {
        // ctx.sender - это адрес КОШЕЛЬКА, который прислал уведомление.
        // В случае SWAP, это будет "Мой кошелек для Валюты А".
        let ctx: Context = context(); 
        
        // Проверяем, разрешен ли обмен с ЭТОГО кошелька (адреса контракта)
        let rate: Int? = self.exchangeRates.get(ctx.sender);

        if (rate != null) {
            // msg.amount - сколько пришло чужих монет
            // rate!! - курс (например, 2)
            let amountToMint: Int = msg.amount * rate!!;

            // msg.sender - это Юзер (кто инициировал перевод).
            // Начисляем новые токены ему.
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
    fun mint(to: Address, amount: Int, response_destination: Address?) {
        self.totalSupply += amount;
        
        // Вычисляем адрес кошелька
        let winit: StateInit = initOf JettonWallet(to, myAddress());
        let walletAddress: Address = contractAddress(winit);
        
        // Отправляем InternalTransfer с code и data
        // Контракт создастся и обработает сообщение
        send(SendParameters{
            to: walletAddress,
            value: ton("1"), // МАКСИМУМ газа
            bounce: false,
            body: InternalTransfer{ 
                queryId: 0,
                amount: amount,
                from: myAddress(),
                responseDestination: response_destination,
                forwardTonAmount: 0,
                forwardPayload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
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
