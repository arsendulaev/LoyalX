message CreateBrand {
    name: String;
    symbol: String;
    description: String;
    image: String;
}

message BrandCreated {
    brandId: Int as uint32;
    brandAddress: Address;
    owner: Address;
}

message SetExchangeRate {
    jettonMasterAddress: Address;
    rate: Int as uint32;
}

message(0x595f07bc) Burn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address?;
}

message(0x7bdd97de) BurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
}

message MintTo {
    to: Address;
    amount: Int as coins;
}

message(0xf8a7ea5) Transfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address; 
    responseDestination: Address?;
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

struct JettonData {
    totalSupply: Int;
    mintable: Bool;
    admin: Address;
    name: String;
    symbol: String;
    walletCode: Cell;
}

struct JettonWalletData {
    balance: Int as coins;
    owner: Address;
    master: Address;
    walletCode: Cell;
}