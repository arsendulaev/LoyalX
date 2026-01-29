import "@stdlib/deploy";

message(0xf8a7ea5) Transfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
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

contract JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    master: Address;

    init(owner: Address, master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    receive(msg: InternalTransfer) {
        self.balance += msg.amount;
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

        if (msg.responseDestination != null) {
            send(SendParameters {
                to: msg.responseDestination,
                value: 0,
                bounce: false,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: Excesses { queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: Transfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Access denied");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance -= msg.amount;
        let targetStateInit: StateInit = initOf JettonWallet(msg.destination, self.master);
        let targetWalletAddress: Address = contractAddress(targetStateInit);
        send(SendParameters{
            to: targetWalletAddress,
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: InternalTransfer{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                responseDestination: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload
            }.toCell(),
            code: targetStateInit.code,
            data: targetStateInit.data
        });
    }

    bounced(msg: bounced<InternalTransfer>) {
        self.balance += msg.amount;
    }
    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData {
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            walletCode: initOf JettonWallet(self.owner, self.master).code,
        };
    }
}

struct JettonWalletData {
    balance: Int as coins;
    owner: Address;
    master: Address;
    walletCode: Cell;
}
