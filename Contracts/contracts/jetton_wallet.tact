import "@stdlib/deploy";
import "./messages.tact";

contract JettonWallet {
    balance: Int as coins;
    owner: Address; 
    master: Address; 

    init(owner: Address, master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    receive(msg: InternalTransfer) {
        let ctx: Context = context();
        if (ctx.sender != self.master) {
            let expectedWallet: StateInit = initOf JettonWallet(msg.from, self.master);
            require(ctx.sender == contractAddress(expectedWallet), "Unauthorized transfer");
        }

        self.balance += msg.amount;

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

        if (msg.responseDestination != null) {
            send(SendParameters {
                to: msg.responseDestination!!,
                to: msg.responseDestination!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue + SendIgnoreErrors,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: Excesses { queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: Transfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "JettonWallet: access denied");
        require(self.balance >= msg.amount, "Insufficient balance");
        self.balance -= msg.amount;

        let targetStateInit: StateInit = initOf JettonWallet(msg.destination, self.master);
        let targetWalletAddress: Address = contractAddress(targetStateInit);

        send(SendParameters{
            to: targetWalletAddress,
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
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
            code: targetStateInit.code,
            data: targetStateInit.data
        });
    }

    receive(msg: Burn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner || ctx.sender == self.master, "Burn: access denied");
        require(self.balance >= msg.amount, "Burn: insufficient balance");

        self.balance -= msg.amount;

        send(SendParameters {
            to: self.master,
            value: ton("0.05"),
            bounce: false,
            body: BurnNotification {
                queryId: msg.queryId,
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination,
            }.toCell(),
        });

        if (msg.responseDestination != null) {
            send(SendParameters {
                to: msg.responseDestination!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: Excesses { queryId: msg.queryId }.toCell(),
            });
        }
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