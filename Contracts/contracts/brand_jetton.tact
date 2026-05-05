import "./messages.tact";
import "./jetton_wallet.tact";

contract BrandJetton {
    totalSupply: Int as coins = 0;
    owner: Address;
    factory: Address;
    name: String;
    symbol: String;
    description: String;
    imageUrl: String;

    discountPercent: Int as uint8 = 10;
    usedNonces: map<Int, Bool>;
    proposedRates: map<Address, Int>;
    acceptedByPeer: map<Address, Bool>;
    acceptedFrom: map<Address, Bool>;
    incomingProposals: map<Address, Int>;

    init(owner: Address, factory: Address, name: String, symbol: String, description: String, imageUrl: String) {
        self.owner = owner;
        self.factory = factory;
        self.name = name;
        self.symbol = symbol;
        self.description = description;
        self.imageUrl = imageUrl;
    }

    receive() {}

    receive(msg: MintTo) {
        let ctx: Context = context();
        require(ctx.sender == self.owner || ctx.sender == self.factory, "Unauthorized mint");
        self.totalSupply += msg.amount;
        self._mintToWallet(msg.queryId, msg.to, msg.amount);
    }

    receive(msg: SwapMint) {
        let ctx: Context = context();
        require(self.acceptedFrom.get(msg.sourceBrand) == true, "No accepted rate from source");
        require(ctx.sender == msg.sourceBrand, "Sender must be sourceBrand");

        self.totalSupply += msg.amount;
        self._mintToWallet(msg.queryId, msg.to, msg.amount);
    }

    receive(msg: TokenBurnNotification) {
        let ctx: Context = context();
        let expectedWallet: Address = contractAddress(initOf JettonWallet(msg.sender, myAddress()));
        require(ctx.sender == expectedWallet, "Invalid wallet");
        self.totalSupply -= msg.amount;
        if (msg.responseDestination != null) {
            send(SendParameters {
                to: msg.responseDestination!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue,
                body: TokenExcesses { queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: TransferNotification) {
        let ctx: Context = context();
        let expectedWallet: Address = contractAddress(initOf JettonWallet(myAddress(), myAddress()));
        require(ctx.sender == expectedWallet, "Invalid wallet");
        let payload: Slice = msg.forwardPayload;
        if (payload.bits() < 8) {
            return;
        }

        let action: Int = payload.loadUint(8);
        if (action == 1) {
            require(payload.bits() >= 64, "Missing nonce");
            let nonce: Int = payload.loadInt(64);
            require(self.usedNonces.get(nonce) == null, "Nonce already used");
            self.usedNonces.set(nonce, true);
        } else if (action == 2) {
            require(payload.bits() >= 267, "Missing targetBrand");
            let targetBrand: Address = payload.loadAddress();
            self._executeSwap(msg.queryId, msg.sender, msg.amount, targetBrand);
        }
    }

    receive(msg: ProposeRate) {
        require(context().sender == self.owner, "Only owner");
        require(msg.rate > 0, "Rate must be positive");
        self.proposedRates.set(msg.targetBrand, msg.rate);
        self.acceptedByPeer.set(msg.targetBrand, false);
        send(SendParameters {
            to: msg.targetBrand,
            value: ton("0.02"),
            bounce: false,
            mode: SendPayGasSeparately,
            body: IncomingProposal { fromBrand: myAddress(), rate: msg.rate }.toCell(),
        });
    }

    receive(msg: IncomingProposal) {
        if (self.acceptedFrom.get(msg.fromBrand) == true) {
            return;
        }
        self.incomingProposals.set(msg.fromBrand, msg.rate);
    }

    receive(msg: AcceptRate) {
        require(context().sender == self.owner, "Only owner");
        let inRate: Int? = self.incomingProposals.get(msg.sourceBrand);
        self.acceptedFrom.set(msg.sourceBrand, true);
        self.incomingProposals.del(msg.sourceBrand);

        if (inRate != null && inRate!! > 0) {
            self.proposedRates.set(msg.sourceBrand, 1000000 / inRate!!);
            self.acceptedByPeer.set(msg.sourceBrand, true);
        }

        send(SendParameters {
            to: msg.sourceBrand,
            value: ton("0.02"),
            bounce: false,
            mode: SendPayGasSeparately,
            body: RateAccepted { fromBrand: myAddress() }.toCell(),
        });
    }

    receive(msg: RateAccepted) {
        let rate: Int? = self.proposedRates.get(msg.fromBrand);
        require(rate != null && rate!! > 0, "No proposal exists for this brand");
        require(context().sender == msg.fromBrand, "Sender must be fromBrand");
        self.acceptedByPeer.set(msg.fromBrand, true);
        self.acceptedFrom.set(msg.fromBrand, true);
    }

    receive(msg: RevokeRate) {
        require(context().sender == self.owner, "Only owner");
        self.proposedRates.set(msg.peerBrand, 0);
        self.acceptedByPeer.set(msg.peerBrand, false);
        self.acceptedFrom.set(msg.peerBrand, false);
    }

    receive(msg: RejectProposal) {
        require(context().sender == self.owner, "Only owner");
        self.incomingProposals.del(msg.fromBrand);

        send(SendParameters {
            to: msg.fromBrand,
            value: ton("0.02"),
            bounce: false,
            mode: SendPayGasSeparately,
            body: RevokeRate { peerBrand: myAddress() }.toCell(),
        });
    }

    receive(msg: SetDiscountPercent) {
        require(context().sender == self.owner, "Only owner");
        require(msg.percent >= 1 && msg.percent <= 100, "Invalid percent");
        self.discountPercent = msg.percent;
    }

    fun _mintToWallet(queryId: Int, to: Address, amount: Int) {
        let walletInit: StateInit = initOf JettonWallet(to, myAddress());
        send(SendParameters {
            to: contractAddress(walletInit),
            value: ton("0.05"),
            bounce: false,
            mode: SendPayGasSeparately,
            body: TokenTransferInternal {
                queryId,
                amount,
                from: myAddress(),
                responseAddress: self.owner,
                forwardTonAmount: 0,
                forwardPayload: emptySlice(),
            }.toCell(),
            code: walletInit.code,
            data: walletInit.data,
        });
    }

    fun _burnHeld(queryId: Int, amount: Int) {
        let walletInit: StateInit = initOf JettonWallet(myAddress(), myAddress());
        send(SendParameters {
            to: contractAddress(walletInit),
            value: ton("0.1"),
            bounce: true,
            mode: SendPayGasSeparately,
            body: TokenBurn {
                queryId,
                amount,
                responseDestination: null,
                customPayload: null,
            }.toCell(),
        });
    }

    fun _executeSwap(queryId: Int, user: Address, amount: Int, targetBrand: Address) {
        let rate: Int? = self.proposedRates.get(targetBrand);
        require(rate != null && rate!! > 0, "No rate proposed for target");
        require(self.acceptedByPeer.get(targetBrand) == true, "Target has not accepted rate");
        let outAmount: Int = (amount * rate!!) / 1000;
        require(outAmount > 0, "Swap amount too small");
        self._burnHeld(queryId, amount);

        send(SendParameters {
            to: targetBrand,
            value: ton("0.1"),
            bounce: false,
            mode: SendPayGasSeparately,
            body: SwapMint {
                queryId,
                to: user,
                amount: outAmount,
                sourceBrand: myAddress(),
            }.toCell(),
        });
    }

    get fun data(): JettonData {
        return JettonData {
            totalSupply: self.totalSupply,
            owner: self.owner,
            name: self.name,
            symbol: self.symbol,
            description: self.description,
            imageUrl: self.imageUrl,
        };
    }

    get fun walletAddress(owner: Address): Address {
        return contractAddress(initOf JettonWallet(owner, myAddress()));
    }

    get fun get_jetton_data(): JettonMasterData {
        let content: map<Int as uint256, Cell> = emptyMap();
        content.set(sha256("name"), beginCell().storeUint(0, 8).storeSlice(self.name.asSlice()).endCell());
        content.set(sha256("symbol"), beginCell().storeUint(0, 8).storeSlice(self.symbol.asSlice()).endCell());
        content.set(sha256("description"), beginCell().storeUint(0, 8).storeSlice(self.description.asSlice()).endCell());
        content.set(sha256("image"), beginCell().storeUint(0, 8).storeSlice(self.imageUrl.asSlice()).endCell());

        let contentCell: Cell = beginCell()
            .storeUint(0, 8)
            .storeMaybeRef(content.asCell())
            .endCell();

        return JettonMasterData {
            totalSupply: self.totalSupply,
            mintable: true,
            adminAddress: self.owner,
            jettonContent: contentCell,
            jettonWalletCode: (initOf JettonWallet(myAddress(), myAddress())).code,
        };
    }

    get fun get_wallet_address(owner_address: Address): Address {
        return contractAddress(initOf JettonWallet(owner_address, myAddress()));
    }

    get fun discountPercent(): Int {
        return self.discountPercent;
    }

    get fun proposedRate(targetBrand: Address): Int {
        let r: Int? = self.proposedRates.get(targetBrand);
        if (r == null) {
            return 0;
        }
        return r!!;
    }

    get fun swapActive(targetBrand: Address): Bool {
        let rate: Int? = self.proposedRates.get(targetBrand);
        if (rate == null || rate!! == 0) {
            return false;
        }
        return self.acceptedByPeer.get(targetBrand) == true;
    }

    get fun getIncomingProposals(): map<Address, Int> {
        return self.incomingProposals;
    }
}
