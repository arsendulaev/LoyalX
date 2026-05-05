message(0x0f8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x178d4519) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    responseAddress: Address?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) TransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0x595f07bc) TokenBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address?;
    customPayload: Cell?;
}

message(0x7bdd97de) TokenBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
}

message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}


struct JettonData {
    totalSupply: Int;
    owner: Address;
    name: String;
    symbol: String;
    description: String;
    imageUrl: String;
}

struct JettonMasterData {
    totalSupply: Int;
    mintable: Bool;
    adminAddress: Address;
    jettonContent: Cell;
    jettonWalletCode: Cell;
}

struct JettonWalletData {
    balance: Int;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}

message MintTo {
    queryId: Int as uint64;
    to: Address;
    amount: Int as coins;
}

message SwapMint {
    queryId: Int as uint64;
    to: Address;
    amount: Int as coins;
    sourceBrand: Address;
}

message SetDiscountPercent {
    percent: Int as uint8;
}

message ProposeRate {
    targetBrand: Address;
    rate: Int as uint32;
}

message AcceptRate {
    sourceBrand: Address;
}

message RateAccepted {
    fromBrand: Address;
}

message RevokeRate {
    peerBrand: Address;
}

message IncomingProposal {
    fromBrand: Address;
    rate: Int as uint32;
}

message RejectProposal {
    fromBrand: Address;
}

message CreateBrand {
    name: String;
    symbol: String;
    description: String;
    imageUrl: String;
}

message SetCreateFee {
    fee: Int as coins;
}

message SetMintbackRate {
    rate: Int as uint64;
}
