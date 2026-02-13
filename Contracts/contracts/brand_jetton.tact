import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages.tact";
import "./jetton_wallet.tact";

contract BrandJetton with Deployable, Ownable {
    owner: Address;
    name: String;
    symbol: String;
    description: String;
    image: String;
    totalSupply: Int as coins;
    mintable: Bool;
    exchangeRates: map<Address, Int>;

    init(owner: Address, name: String, symbol: String, description: String, image: String) {
        self.owner = owner;
        self.name = name;
        self.symbol = symbol;
        self.description = description;
        self.image = image;
        self.totalSupply = 0;
        self.mintable = true;
    }

    receive("Mint") {
        let ctx: Context = context();
        self.requireOwner();
        self.mint(ctx.sender, 1000000000000, ctx.sender);
    }

    receive(msg: MintTo) {
        self.requireOwner();
        self.mint(msg.to, msg.amount, msg.to);
    }

    receive(msg: TransferNotification) {
        let ctx: Context = context();

        require(msg.forwardPayload.bits() >= 267, "Swap: invalid forwardPayload");
        let masterAddress: Address = msg.forwardPayload.loadAddress();

        let rate: Int? = self.exchangeRates.get(masterAddress);

        require(rate != null, "Swap: no exchange rate");

        let amountToMint: Int = msg.amount * rate!!;

        send(SendParameters {
            to: ctx.sender,
            value: ton("0.1"),
            bounce: true,
            body: Burn {
                queryId: msg.queryId,
                amount: msg.amount,
                responseDestination: msg.sender,
            }.toCell(),
        });

        self.mint(msg.sender, amountToMint, msg.sender);
    }

    receive(msg: InternalTransfer) {
        require(msg.forwardPayload.bits() >= 267, "Swap: invalid forwardPayload");
        let masterAddress: Address = msg.forwardPayload.loadAddress();

        let rate: Int? = self.exchangeRates.get(masterAddress);

        require(rate != null, "Swap: no exchange rate");

        let amountToMint: Int = msg.amount * rate!!;

        send(SendParameters {
            to: msg.from,
            value: ton("0.1"),
            bounce: true,
            body: Burn {
                queryId: msg.queryId,
                amount: msg.amount,
                responseDestination: msg.responseDestination,
            }.toCell(),
        });

        self.mint(msg.from, amountToMint, msg.responseDestination);
    }

    receive(msg: SetExchangeRate) {
        self.requireOwner();
        self.exchangeRates.set(msg.jettonMasterAddress, msg.rate);
    }

    receive(msg: BurnNotification) {
        self.totalSupply -= msg.amount;

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

    receive(msg: Burn) {
        let ctx: Context = context();
        let expectedWallet: StateInit = initOf JettonWallet(ctx.sender, myAddress());
        let expectedWalletAddress: Address = contractAddress(expectedWallet);
        require(ctx.sender == expectedWalletAddress, "Burn: invalid jetton wallet");

        self.totalSupply -= msg.amount;

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

    fun mint(to: Address, amount: Int, response_destination: Address?) {
        require(self.mintable, "Minting is disabled");
        self.totalSupply += amount;
        
        let winit: StateInit = initOf JettonWallet(to, myAddress());
        let walletAddress: Address = contractAddress(winit);
        
        send(SendParameters{
            to: walletAddress,
            value: ton("0.05"),
            bounce: true,
            body: InternalTransfer{ 
                queryId: 0,
                amount: amount,
                from: myAddress(),
                responseDestination: response_destination,
                forwardTonAmount: ton("0.01"),
                forwardPayload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
            code: winit.code,
            data: winit.data
        });
    }

    get fun get_jetton_data(): JettonData {
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: self.mintable,
            admin: self.owner,
            name: self.name,
            symbol: self.symbol,
            walletCode: initOf JettonWallet(self.owner, myAddress()).code
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        let winit: StateInit = initOf JettonWallet(owner, myAddress());
        return contractAddress(winit);
    }
}