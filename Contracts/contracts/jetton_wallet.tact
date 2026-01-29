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
    responseDestination: Address;
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
    balance: Int as coins = 0;
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
        if (msg.forwardTonAmount > 0) {
            send(SendParameters {
                to: self.owner,
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
                to: msg.responseDestination,
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

        // Только владелец кошелька может тратить деньги
        require(ctx.sender == self.owner, "Access denied");
        require(self.balance >= msg.amount, "Insufficient balance");

        // Списываем средства
        self.balance -= msg.amount;

        // ВНИМАНИЕ: Здесь в полноценном стандарте мы должны ВЫЧИСЛИТЬ адрес
        // кошелька получателя (RecipientWallet).
        // Но так как `init` код кошелька хранится в Мастере,
        // то часто в упрощенных версиях мы шлем через Мастер или
        // требуем, чтобы фронтенд прислал адрес кошелька получателя.

        // Для MVP и корректной архитектуры TEP-74, правильный путь:
        // Кошелек должен уметь вычислять адрес другого кошелька.
        // Для этого нам нужно обновить `BrandJetton`, чтобы он передал нам код кошелька.

        // ПОКА (Заглушка для компиляции): Мы предполагаем, что сообщение уйдет
        // на `destination` (но в реальности оно должно идти на JettonWallet получателя).
        // Мы это поправим на следующем шаге "Связывания".
    }

    // 3. ОБРАБОТКА ОШИБОК (Bounced)
    // Если мы отправили деньги, а там ошибка - возвращаем на баланс
    bounced(msg: InternalTransfer) {
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
