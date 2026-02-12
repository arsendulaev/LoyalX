import "@stdlib/deploy";

// --- Повторяем определения сообщений (чтобы Tact их видел в этом файле) ---

message(0xf8a7ea5) Transfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address; // Адрес КОНЕЧНОГО получателя (User), а не его кошелька
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x178d4519) InternalTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    responseDestination: Address?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) TransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0xd53276db) Excesses {
    queryId: Int as uint64;
}

// --- Сам контракт Кошелька ---

contract JettonWallet {
    balance: Int as coins;
    owner: Address; // Владелец этого кошелька (User)
    master: Address; // Адрес Мастер-контракта (BrandJetton)

    init(owner: Address, master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    // 1. ПОЛУЧЕНИЕ СРЕДСТВ (Входящий перевод)
    // Это сообщение приходит либо от Мастера (минт), либо от другого кошелька
    receive(msg: InternalTransfer) {
        // Увеличиваем баланс
        self.balance += msg.amount;

        // Если отправитель просил уведомить владельца (например, для фронтенда)
        if (msg.responseDestination != null) {
            send(SendParameters {
                to: msg.responseDestination!!,
                value: msg.forwardTonAmount,
                bounce: false,
                body: TransferNotification {
                    queryId: msg.queryId,
                    amount: msg.amount,
                    sender: msg.from,
                    forwardPayload: msg.forwardPayload,
                }.toCell(),
            });
        }

        // Возвращаем сдачу (Gas) тому, кто указан в response_destination
        if (msg.responseDestination != null) {
            send(SendParameters {
                to: msg.responseDestination!!, // Разворачиваем Optional тип
                value: 0,
                bounce: false,
                mode: SendRemainingValue + SendIgnoreErrors, // Весь остаток газа
                body: Excesses { queryId: msg.queryId }.toCell(),
            });
        }
    }

    // 2. ОТПРАВКА СРЕДСТВ (Исходящий перевод)
    // Это вызывает сам пользователь из приложения LoyalX
    receive(msg: Transfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Access denied");
        require(self.balance >= msg.amount, "Insufficient balance");

        self.balance -= msg.amount;

        // --- ИСПРАВЛЕНИЕ НАЧАЛО ---
        
        // 1. Вычисляем StateInit кошелька получателя
        // (Мы предполагаем, что у получателя такой же мастер, как у нас)
        let targetStateInit: StateInit = initOf JettonWallet(msg.destination, self.master);
        let targetWalletAddress: Address = contractAddress(targetStateInit);

        // 2. Отправляем InternalTransfer на АДРЕС КОШЕЛЬКА ПОЛУЧАТЕЛЯ
        send(SendParameters{
            to: targetWalletAddress,
            value: 0,
            bounce: true,
            mode: SendRemainingValue, // Пересылаем весь газ дальше
            body: InternalTransfer{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner, // Указываем, от кого реально пришли деньги
                responseDestination: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload
            }.toCell(),
            code: targetStateInit.code, // Приложить код, если кошелек еще не создан
            data: targetStateInit.data
        });
        // --- ИСПРАВЛЕНИЕ КОНЕЦ ---
    }

    // 3. ОБРАБОТКА ОШИБОК (Bounced)
    // Если мы отправили деньги, а там ошибка - возвращаем на баланс
    bounced(msg: bounced<InternalTransfer>) {
        // При баунсе нам доступны только первые поля, которые влезли в лимит.
        // amount находится в начале InternalTransfer, поэтому он доступен.
        self.balance += msg.amount;
    }
    // Геттер для отображения баланса во фронтенде
    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData {
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            walletCode: initOf JettonWallet(self.owner, self.master).code,
        };
    }
}

// Вспомогательная структура для геттера
struct JettonWalletData {
    balance: Int as coins;
    owner: Address;
    master: Address;
    walletCode: Cell;
}
