import "@stdlib/deploy";
import "@stdlib/ownable";
import "./jetton_wallet";

message SetExchangeRate {
    jettonWalletAddress: Address;
    rate: Int as uint32;
}

contract BrandJetton with Deployable, Ownable {
    owner: Address;
    symbol: String;
    name: String;
    content: Cell;
    totalSupply: Int as coins;
    mintable: Bool;
    exchangeRates: map<Address, Int>;

    init(owner: Address, symbol: String, name: String, content: Cell) {
        self.owner = owner;
        self.symbol = symbol;
        self.name = name;
        self.content = content;
        self.totalSupply = 0;
        self.mintable = true;
    }

    receive("Mint") {
        let ctx: Context = context();
        self.requireOwner();
        self.mint(ctx.sender, ton("100"), ctx.sender);
    }

    receive(msg: TransferNotification) {
        let ctx: Context = context(); 
        let rate: Int? = self.exchangeRates.get(ctx.sender);

        if (rate != null) {
            let amountToMint: Int = msg.amount * rate!!;
            self.mint(msg.sender, amountToMint, msg.sender);
        }
    }

    receive(msg: SetExchangeRate) {
        self.requireOwner();
        self.exchangeRates.set(msg.jettonWalletAddress, msg.rate);
    }

    fun mint(to: Address, amount: Int, response_destination: Address?) {
        self.totalSupply += amount;
        let winit: StateInit = initOf JettonWallet(to, myAddress());
        send(SendParameters{
            to: contractAddress(winit),
            value: 0, 
            bounce: true,
            mode: SendRemainingValue,
            body: InternalTransfer{ 
                queryId: 0,
                amount: amount,
                from: myAddress(),
                responseDestination: responseDestination,
                forwardTonAmount: 0,
                forwardPayload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }

    get fun get_jetton_data(): JettonData {
        return JettonData{ 
            totalSupply: self.totalSupply, 
            mintable: self.mintable, 
            admin: self.owner, 
            content: self.content, 
            walletCode: initOf JettonWallet(self.owner, myAddress()).code
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        let winit: StateInit = initOf JettonWallet(owner, myAddress());
        return contractAddress(winit);
    }
}

struct JettonData {
    totalSupply: Int;
    mintable: Bool;
    admin: Address;
    content: Cell;
    walletCode: Cell;
}
