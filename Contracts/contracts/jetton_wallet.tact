import "./messages.tact";

contract JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    master: Address;

    init(owner: Address, master: Address) {
        self.owner = owner;
        self.master = master;
    }

    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();
        let expectedWallet: Address = contractAddress(initOf JettonWallet(msg.from, self.master));
        require(ctx.sender == self.master || ctx.sender == expectedWallet, "Unauthorized sender");
        self.balance += msg.amount;
        if (msg.forwardTonAmount > 0) {
            send(SendParameters {
                to: self.owner,
                value: 0,
                bounce: false,
                mode: SendRemainingValue,
                body: TransferNotification {
                    queryId: msg.queryId,
                    amount: msg.amount,
                    sender: msg.from,
                    forwardPayload: msg.forwardPayload,
                }.toCell(),
            });
            return;
        }

        if (msg.responseAddress != null) {
            send(SendParameters {
                to: msg.responseAddress!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue,
                body: TokenExcesses { queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can transfer");
        require(self.balance >= msg.amount, "Insufficient balance");
        require(ctx.value >= ton("0.05"), "Insufficient TON for fees");
        self.balance -= msg.amount;
        let destWallet: Address = contractAddress(initOf JettonWallet(msg.destination, self.master));
        send(SendParameters {
            to: destWallet,
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: TokenTransferInternal {
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                responseAddress: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload,
            }.toCell(),
            code: initOf JettonWallet(msg.destination, self.master).code,
            data: initOf JettonWallet(msg.destination, self.master).data,
        });
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can burn");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance -= msg.amount;

        send(SendParameters {
            to: self.master,
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: TokenBurnNotification {
                queryId: msg.queryId,
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination,
            }.toCell(),
        });
    }

    bounced(msg: bounced<TokenTransferInternal>) {
        self.balance += msg.amount;
    }

    bounced(msg: bounced<TokenBurnNotification>) {
        self.balance += msg.amount;
    }

    get fun balance(): Int {
        return self.balance;
    }

    get fun owner(): Address {
        return self.owner;
    }

    get fun master(): Address {
        return self.master;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData {
            balance: self.balance,
            ownerAddress: self.owner,
            jettonMasterAddress: self.master,
            jettonWalletCode: (initOf JettonWallet(self.owner, self.master)).code,
        };
    }
}
