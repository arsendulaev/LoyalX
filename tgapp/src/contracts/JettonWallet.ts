import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type TokenTransfer = {
    $$type: 'TokenTransfer';
    queryId: bigint;
    amount: bigint;
    destination: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardTonAmount: bigint;
    forwardPayload: Slice;
}

export function storeTokenTransfer(src: TokenTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(260734629, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forwardTonAmount);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadTokenTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 260734629) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forwardTonAmount = sc_0.loadCoins();
    const _forwardPayload = sc_0;
    return { $$type: 'TokenTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadTupleTokenTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'TokenTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadGetterTupleTokenTransfer(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'TokenTransfer' as const, queryId: _queryId, amount: _amount, destination: _destination, responseDestination: _responseDestination, customPayload: _customPayload, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function storeTupleTokenTransfer(source: TokenTransfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    builder.writeNumber(source.forwardTonAmount);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserTokenTransfer(): DictionaryValue<TokenTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTokenTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadTokenTransfer(src.loadRef().beginParse());
        }
    }
}

export type TokenTransferInternal = {
    $$type: 'TokenTransferInternal';
    queryId: bigint;
    amount: bigint;
    from: Address;
    responseAddress: Address | null;
    forwardTonAmount: bigint;
    forwardPayload: Slice;
}

export function storeTokenTransferInternal(src: TokenTransferInternal) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(395134233, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.from);
        b_0.storeAddress(src.responseAddress);
        b_0.storeCoins(src.forwardTonAmount);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadTokenTransferInternal(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 395134233) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _from = sc_0.loadAddress();
    const _responseAddress = sc_0.loadMaybeAddress();
    const _forwardTonAmount = sc_0.loadCoins();
    const _forwardPayload = sc_0;
    return { $$type: 'TokenTransferInternal' as const, queryId: _queryId, amount: _amount, from: _from, responseAddress: _responseAddress, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadTupleTokenTransferInternal(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _from = source.readAddress();
    const _responseAddress = source.readAddressOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'TokenTransferInternal' as const, queryId: _queryId, amount: _amount, from: _from, responseAddress: _responseAddress, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function loadGetterTupleTokenTransferInternal(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _from = source.readAddress();
    const _responseAddress = source.readAddressOpt();
    const _forwardTonAmount = source.readBigNumber();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'TokenTransferInternal' as const, queryId: _queryId, amount: _amount, from: _from, responseAddress: _responseAddress, forwardTonAmount: _forwardTonAmount, forwardPayload: _forwardPayload };
}

export function storeTupleTokenTransferInternal(source: TokenTransferInternal) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.from);
    builder.writeAddress(source.responseAddress);
    builder.writeNumber(source.forwardTonAmount);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserTokenTransferInternal(): DictionaryValue<TokenTransferInternal> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTokenTransferInternal(src)).endCell());
        },
        parse: (src) => {
            return loadTokenTransferInternal(src.loadRef().beginParse());
        }
    }
}

export type TransferNotification = {
    $$type: 'TransferNotification';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    forwardPayload: Slice;
}

export function storeTransferNotification(src: TransferNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forwardPayload.asBuilder());
    };
}

export function loadTransferNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forwardPayload = sc_0;
    return { $$type: 'TransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadTupleTransferNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'TransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function loadGetterTupleTransferNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forwardPayload = source.readCell().asSlice();
    return { $$type: 'TransferNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, forwardPayload: _forwardPayload };
}

export function storeTupleTransferNotification(source: TransferNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forwardPayload.asCell());
    return builder.build();
}

export function dictValueParserTransferNotification(): DictionaryValue<TransferNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTransferNotification(src)).endCell());
        },
        parse: (src) => {
            return loadTransferNotification(src.loadRef().beginParse());
        }
    }
}

export type TokenBurn = {
    $$type: 'TokenBurn';
    queryId: bigint;
    amount: bigint;
    responseDestination: Address | null;
    customPayload: Cell | null;
}

export function storeTokenBurn(src: TokenBurn) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1499400124, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.responseDestination);
        if (src.customPayload !== null && src.customPayload !== undefined) { b_0.storeBit(true).storeRef(src.customPayload); } else { b_0.storeBit(false); }
    };
}

export function loadTokenBurn(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1499400124) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _responseDestination = sc_0.loadMaybeAddress();
    const _customPayload = sc_0.loadBit() ? sc_0.loadRef() : null;
    return { $$type: 'TokenBurn' as const, queryId: _queryId, amount: _amount, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function loadTupleTokenBurn(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    return { $$type: 'TokenBurn' as const, queryId: _queryId, amount: _amount, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function loadGetterTupleTokenBurn(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _responseDestination = source.readAddressOpt();
    const _customPayload = source.readCellOpt();
    return { $$type: 'TokenBurn' as const, queryId: _queryId, amount: _amount, responseDestination: _responseDestination, customPayload: _customPayload };
}

export function storeTupleTokenBurn(source: TokenBurn) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.responseDestination);
    builder.writeCell(source.customPayload);
    return builder.build();
}

export function dictValueParserTokenBurn(): DictionaryValue<TokenBurn> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTokenBurn(src)).endCell());
        },
        parse: (src) => {
            return loadTokenBurn(src.loadRef().beginParse());
        }
    }
}

export type TokenBurnNotification = {
    $$type: 'TokenBurnNotification';
    queryId: bigint;
    amount: bigint;
    sender: Address;
    responseDestination: Address | null;
}

export function storeTokenBurnNotification(src: TokenBurnNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2078119902, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeAddress(src.responseDestination);
    };
}

export function loadTokenBurnNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2078119902) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _responseDestination = sc_0.loadMaybeAddress();
    return { $$type: 'TokenBurnNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination };
}

export function loadTupleTokenBurnNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    return { $$type: 'TokenBurnNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination };
}

export function loadGetterTupleTokenBurnNotification(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _responseDestination = source.readAddressOpt();
    return { $$type: 'TokenBurnNotification' as const, queryId: _queryId, amount: _amount, sender: _sender, responseDestination: _responseDestination };
}

export function storeTupleTokenBurnNotification(source: TokenBurnNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeAddress(source.responseDestination);
    return builder.build();
}

export function dictValueParserTokenBurnNotification(): DictionaryValue<TokenBurnNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTokenBurnNotification(src)).endCell());
        },
        parse: (src) => {
            return loadTokenBurnNotification(src.loadRef().beginParse());
        }
    }
}

export type TokenExcesses = {
    $$type: 'TokenExcesses';
    queryId: bigint;
}

export function storeTokenExcesses(src: TokenExcesses) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3576854235, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadTokenExcesses(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3576854235) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'TokenExcesses' as const, queryId: _queryId };
}

export function loadTupleTokenExcesses(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'TokenExcesses' as const, queryId: _queryId };
}

export function loadGetterTupleTokenExcesses(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'TokenExcesses' as const, queryId: _queryId };
}

export function storeTupleTokenExcesses(source: TokenExcesses) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserTokenExcesses(): DictionaryValue<TokenExcesses> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTokenExcesses(src)).endCell());
        },
        parse: (src) => {
            return loadTokenExcesses(src.loadRef().beginParse());
        }
    }
}

export type JettonData = {
    $$type: 'JettonData';
    totalSupply: bigint;
    owner: Address;
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
}

export function storeJettonData(src: JettonData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.totalSupply, 257);
        b_0.storeAddress(src.owner);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
        const b_1 = new Builder();
        b_1.storeStringRefTail(src.description);
        b_1.storeStringRefTail(src.imageUrl);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadJettonData(slice: Slice) {
    const sc_0 = slice;
    const _totalSupply = sc_0.loadIntBig(257);
    const _owner = sc_0.loadAddress();
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    const sc_1 = sc_0.loadRef().beginParse();
    const _description = sc_1.loadStringRefTail();
    const _imageUrl = sc_1.loadStringRefTail();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, owner: _owner, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl };
}

export function loadTupleJettonData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _owner = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _description = source.readString();
    const _imageUrl = source.readString();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, owner: _owner, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl };
}

export function loadGetterTupleJettonData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _owner = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _description = source.readString();
    const _imageUrl = source.readString();
    return { $$type: 'JettonData' as const, totalSupply: _totalSupply, owner: _owner, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl };
}

export function storeTupleJettonData(source: JettonData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalSupply);
    builder.writeAddress(source.owner);
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    builder.writeString(source.description);
    builder.writeString(source.imageUrl);
    return builder.build();
}

export function dictValueParserJettonData(): DictionaryValue<JettonData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonData(src.loadRef().beginParse());
        }
    }
}

export type JettonMasterData = {
    $$type: 'JettonMasterData';
    totalSupply: bigint;
    mintable: boolean;
    adminAddress: Address;
    jettonContent: Cell;
    jettonWalletCode: Cell;
}

export function storeJettonMasterData(src: JettonMasterData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.totalSupply, 257);
        b_0.storeBit(src.mintable);
        b_0.storeAddress(src.adminAddress);
        b_0.storeRef(src.jettonContent);
        b_0.storeRef(src.jettonWalletCode);
    };
}

export function loadJettonMasterData(slice: Slice) {
    const sc_0 = slice;
    const _totalSupply = sc_0.loadIntBig(257);
    const _mintable = sc_0.loadBit();
    const _adminAddress = sc_0.loadAddress();
    const _jettonContent = sc_0.loadRef();
    const _jettonWalletCode = sc_0.loadRef();
    return { $$type: 'JettonMasterData' as const, totalSupply: _totalSupply, mintable: _mintable, adminAddress: _adminAddress, jettonContent: _jettonContent, jettonWalletCode: _jettonWalletCode };
}

export function loadTupleJettonMasterData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _adminAddress = source.readAddress();
    const _jettonContent = source.readCell();
    const _jettonWalletCode = source.readCell();
    return { $$type: 'JettonMasterData' as const, totalSupply: _totalSupply, mintable: _mintable, adminAddress: _adminAddress, jettonContent: _jettonContent, jettonWalletCode: _jettonWalletCode };
}

export function loadGetterTupleJettonMasterData(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _mintable = source.readBoolean();
    const _adminAddress = source.readAddress();
    const _jettonContent = source.readCell();
    const _jettonWalletCode = source.readCell();
    return { $$type: 'JettonMasterData' as const, totalSupply: _totalSupply, mintable: _mintable, adminAddress: _adminAddress, jettonContent: _jettonContent, jettonWalletCode: _jettonWalletCode };
}

export function storeTupleJettonMasterData(source: JettonMasterData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalSupply);
    builder.writeBoolean(source.mintable);
    builder.writeAddress(source.adminAddress);
    builder.writeCell(source.jettonContent);
    builder.writeCell(source.jettonWalletCode);
    return builder.build();
}

export function dictValueParserJettonMasterData(): DictionaryValue<JettonMasterData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonMasterData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonMasterData(src.loadRef().beginParse());
        }
    }
}

export type JettonWalletData = {
    $$type: 'JettonWalletData';
    balance: bigint;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}

export function storeJettonWalletData(src: JettonWalletData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.balance, 257);
        b_0.storeAddress(src.ownerAddress);
        b_0.storeAddress(src.jettonMasterAddress);
        b_0.storeRef(src.jettonWalletCode);
    };
}

export function loadJettonWalletData(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadIntBig(257);
    const _ownerAddress = sc_0.loadAddress();
    const _jettonMasterAddress = sc_0.loadAddress();
    const _jettonWalletCode = sc_0.loadRef();
    return { $$type: 'JettonWalletData' as const, balance: _balance, ownerAddress: _ownerAddress, jettonMasterAddress: _jettonMasterAddress, jettonWalletCode: _jettonWalletCode };
}

export function loadTupleJettonWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _ownerAddress = source.readAddress();
    const _jettonMasterAddress = source.readAddress();
    const _jettonWalletCode = source.readCell();
    return { $$type: 'JettonWalletData' as const, balance: _balance, ownerAddress: _ownerAddress, jettonMasterAddress: _jettonMasterAddress, jettonWalletCode: _jettonWalletCode };
}

export function loadGetterTupleJettonWalletData(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _ownerAddress = source.readAddress();
    const _jettonMasterAddress = source.readAddress();
    const _jettonWalletCode = source.readCell();
    return { $$type: 'JettonWalletData' as const, balance: _balance, ownerAddress: _ownerAddress, jettonMasterAddress: _jettonMasterAddress, jettonWalletCode: _jettonWalletCode };
}

export function storeTupleJettonWalletData(source: JettonWalletData) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.ownerAddress);
    builder.writeAddress(source.jettonMasterAddress);
    builder.writeCell(source.jettonWalletCode);
    return builder.build();
}

export function dictValueParserJettonWalletData(): DictionaryValue<JettonWalletData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonWalletData(src)).endCell());
        },
        parse: (src) => {
            return loadJettonWalletData(src.loadRef().beginParse());
        }
    }
}

export type MintTo = {
    $$type: 'MintTo';
    queryId: bigint;
    to: Address;
    amount: bigint;
}

export function storeMintTo(src: MintTo) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4095612892, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.to);
        b_0.storeCoins(src.amount);
    };
}

export function loadMintTo(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4095612892) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _to = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    return { $$type: 'MintTo' as const, queryId: _queryId, to: _to, amount: _amount };
}

export function loadTupleMintTo(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'MintTo' as const, queryId: _queryId, to: _to, amount: _amount };
}

export function loadGetterTupleMintTo(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    return { $$type: 'MintTo' as const, queryId: _queryId, to: _to, amount: _amount };
}

export function storeTupleMintTo(source: MintTo) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.to);
    builder.writeNumber(source.amount);
    return builder.build();
}

export function dictValueParserMintTo(): DictionaryValue<MintTo> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMintTo(src)).endCell());
        },
        parse: (src) => {
            return loadMintTo(src.loadRef().beginParse());
        }
    }
}

export type SwapMint = {
    $$type: 'SwapMint';
    queryId: bigint;
    to: Address;
    amount: bigint;
    sourceBrand: Address;
}

export function storeSwapMint(src: SwapMint) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1238517432, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.to);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sourceBrand);
    };
}

export function loadSwapMint(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1238517432) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _to = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const _sourceBrand = sc_0.loadAddress();
    return { $$type: 'SwapMint' as const, queryId: _queryId, to: _to, amount: _amount, sourceBrand: _sourceBrand };
}

export function loadTupleSwapMint(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    const _sourceBrand = source.readAddress();
    return { $$type: 'SwapMint' as const, queryId: _queryId, to: _to, amount: _amount, sourceBrand: _sourceBrand };
}

export function loadGetterTupleSwapMint(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _to = source.readAddress();
    const _amount = source.readBigNumber();
    const _sourceBrand = source.readAddress();
    return { $$type: 'SwapMint' as const, queryId: _queryId, to: _to, amount: _amount, sourceBrand: _sourceBrand };
}

export function storeTupleSwapMint(source: SwapMint) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.to);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sourceBrand);
    return builder.build();
}

export function dictValueParserSwapMint(): DictionaryValue<SwapMint> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSwapMint(src)).endCell());
        },
        parse: (src) => {
            return loadSwapMint(src.loadRef().beginParse());
        }
    }
}

export type SetDiscountPercent = {
    $$type: 'SetDiscountPercent';
    percent: bigint;
}

export function storeSetDiscountPercent(src: SetDiscountPercent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3310276447, 32);
        b_0.storeUint(src.percent, 8);
    };
}

export function loadSetDiscountPercent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3310276447) { throw Error('Invalid prefix'); }
    const _percent = sc_0.loadUintBig(8);
    return { $$type: 'SetDiscountPercent' as const, percent: _percent };
}

export function loadTupleSetDiscountPercent(source: TupleReader) {
    const _percent = source.readBigNumber();
    return { $$type: 'SetDiscountPercent' as const, percent: _percent };
}

export function loadGetterTupleSetDiscountPercent(source: TupleReader) {
    const _percent = source.readBigNumber();
    return { $$type: 'SetDiscountPercent' as const, percent: _percent };
}

export function storeTupleSetDiscountPercent(source: SetDiscountPercent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.percent);
    return builder.build();
}

export function dictValueParserSetDiscountPercent(): DictionaryValue<SetDiscountPercent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetDiscountPercent(src)).endCell());
        },
        parse: (src) => {
            return loadSetDiscountPercent(src.loadRef().beginParse());
        }
    }
}

export type ProposeRate = {
    $$type: 'ProposeRate';
    targetBrand: Address;
    rate: bigint;
}

export function storeProposeRate(src: ProposeRate) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(848762246, 32);
        b_0.storeAddress(src.targetBrand);
        b_0.storeUint(src.rate, 32);
    };
}

export function loadProposeRate(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 848762246) { throw Error('Invalid prefix'); }
    const _targetBrand = sc_0.loadAddress();
    const _rate = sc_0.loadUintBig(32);
    return { $$type: 'ProposeRate' as const, targetBrand: _targetBrand, rate: _rate };
}

export function loadTupleProposeRate(source: TupleReader) {
    const _targetBrand = source.readAddress();
    const _rate = source.readBigNumber();
    return { $$type: 'ProposeRate' as const, targetBrand: _targetBrand, rate: _rate };
}

export function loadGetterTupleProposeRate(source: TupleReader) {
    const _targetBrand = source.readAddress();
    const _rate = source.readBigNumber();
    return { $$type: 'ProposeRate' as const, targetBrand: _targetBrand, rate: _rate };
}

export function storeTupleProposeRate(source: ProposeRate) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.targetBrand);
    builder.writeNumber(source.rate);
    return builder.build();
}

export function dictValueParserProposeRate(): DictionaryValue<ProposeRate> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeProposeRate(src)).endCell());
        },
        parse: (src) => {
            return loadProposeRate(src.loadRef().beginParse());
        }
    }
}

export type AcceptRate = {
    $$type: 'AcceptRate';
    sourceBrand: Address;
}

export function storeAcceptRate(src: AcceptRate) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1554609579, 32);
        b_0.storeAddress(src.sourceBrand);
    };
}

export function loadAcceptRate(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1554609579) { throw Error('Invalid prefix'); }
    const _sourceBrand = sc_0.loadAddress();
    return { $$type: 'AcceptRate' as const, sourceBrand: _sourceBrand };
}

export function loadTupleAcceptRate(source: TupleReader) {
    const _sourceBrand = source.readAddress();
    return { $$type: 'AcceptRate' as const, sourceBrand: _sourceBrand };
}

export function loadGetterTupleAcceptRate(source: TupleReader) {
    const _sourceBrand = source.readAddress();
    return { $$type: 'AcceptRate' as const, sourceBrand: _sourceBrand };
}

export function storeTupleAcceptRate(source: AcceptRate) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.sourceBrand);
    return builder.build();
}

export function dictValueParserAcceptRate(): DictionaryValue<AcceptRate> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeAcceptRate(src)).endCell());
        },
        parse: (src) => {
            return loadAcceptRate(src.loadRef().beginParse());
        }
    }
}

export type RateAccepted = {
    $$type: 'RateAccepted';
    fromBrand: Address;
}

export function storeRateAccepted(src: RateAccepted) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1695163564, 32);
        b_0.storeAddress(src.fromBrand);
    };
}

export function loadRateAccepted(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1695163564) { throw Error('Invalid prefix'); }
    const _fromBrand = sc_0.loadAddress();
    return { $$type: 'RateAccepted' as const, fromBrand: _fromBrand };
}

export function loadTupleRateAccepted(source: TupleReader) {
    const _fromBrand = source.readAddress();
    return { $$type: 'RateAccepted' as const, fromBrand: _fromBrand };
}

export function loadGetterTupleRateAccepted(source: TupleReader) {
    const _fromBrand = source.readAddress();
    return { $$type: 'RateAccepted' as const, fromBrand: _fromBrand };
}

export function storeTupleRateAccepted(source: RateAccepted) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.fromBrand);
    return builder.build();
}

export function dictValueParserRateAccepted(): DictionaryValue<RateAccepted> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRateAccepted(src)).endCell());
        },
        parse: (src) => {
            return loadRateAccepted(src.loadRef().beginParse());
        }
    }
}

export type RevokeRate = {
    $$type: 'RevokeRate';
    peerBrand: Address;
}

export function storeRevokeRate(src: RevokeRate) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2108943833, 32);
        b_0.storeAddress(src.peerBrand);
    };
}

export function loadRevokeRate(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2108943833) { throw Error('Invalid prefix'); }
    const _peerBrand = sc_0.loadAddress();
    return { $$type: 'RevokeRate' as const, peerBrand: _peerBrand };
}

export function loadTupleRevokeRate(source: TupleReader) {
    const _peerBrand = source.readAddress();
    return { $$type: 'RevokeRate' as const, peerBrand: _peerBrand };
}

export function loadGetterTupleRevokeRate(source: TupleReader) {
    const _peerBrand = source.readAddress();
    return { $$type: 'RevokeRate' as const, peerBrand: _peerBrand };
}

export function storeTupleRevokeRate(source: RevokeRate) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.peerBrand);
    return builder.build();
}

export function dictValueParserRevokeRate(): DictionaryValue<RevokeRate> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRevokeRate(src)).endCell());
        },
        parse: (src) => {
            return loadRevokeRate(src.loadRef().beginParse());
        }
    }
}

export type CreateBrand = {
    $$type: 'CreateBrand';
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
}

export function storeCreateBrand(src: CreateBrand) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(619442111, 32);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
        const b_1 = new Builder();
        b_1.storeStringRefTail(src.description);
        b_1.storeStringRefTail(src.imageUrl);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadCreateBrand(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 619442111) { throw Error('Invalid prefix'); }
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    const sc_1 = sc_0.loadRef().beginParse();
    const _description = sc_1.loadStringRefTail();
    const _imageUrl = sc_1.loadStringRefTail();
    return { $$type: 'CreateBrand' as const, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl };
}

export function loadTupleCreateBrand(source: TupleReader) {
    const _name = source.readString();
    const _symbol = source.readString();
    const _description = source.readString();
    const _imageUrl = source.readString();
    return { $$type: 'CreateBrand' as const, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl };
}

export function loadGetterTupleCreateBrand(source: TupleReader) {
    const _name = source.readString();
    const _symbol = source.readString();
    const _description = source.readString();
    const _imageUrl = source.readString();
    return { $$type: 'CreateBrand' as const, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl };
}

export function storeTupleCreateBrand(source: CreateBrand) {
    const builder = new TupleBuilder();
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    builder.writeString(source.description);
    builder.writeString(source.imageUrl);
    return builder.build();
}

export function dictValueParserCreateBrand(): DictionaryValue<CreateBrand> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateBrand(src)).endCell());
        },
        parse: (src) => {
            return loadCreateBrand(src.loadRef().beginParse());
        }
    }
}

export type SetCreateFee = {
    $$type: 'SetCreateFee';
    fee: bigint;
}

export function storeSetCreateFee(src: SetCreateFee) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3354333758, 32);
        b_0.storeCoins(src.fee);
    };
}

export function loadSetCreateFee(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3354333758) { throw Error('Invalid prefix'); }
    const _fee = sc_0.loadCoins();
    return { $$type: 'SetCreateFee' as const, fee: _fee };
}

export function loadTupleSetCreateFee(source: TupleReader) {
    const _fee = source.readBigNumber();
    return { $$type: 'SetCreateFee' as const, fee: _fee };
}

export function loadGetterTupleSetCreateFee(source: TupleReader) {
    const _fee = source.readBigNumber();
    return { $$type: 'SetCreateFee' as const, fee: _fee };
}

export function storeTupleSetCreateFee(source: SetCreateFee) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.fee);
    return builder.build();
}

export function dictValueParserSetCreateFee(): DictionaryValue<SetCreateFee> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetCreateFee(src)).endCell());
        },
        parse: (src) => {
            return loadSetCreateFee(src.loadRef().beginParse());
        }
    }
}

export type SetMintbackRate = {
    $$type: 'SetMintbackRate';
    rate: bigint;
}

export function storeSetMintbackRate(src: SetMintbackRate) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2186379215, 32);
        b_0.storeUint(src.rate, 64);
    };
}

export function loadSetMintbackRate(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2186379215) { throw Error('Invalid prefix'); }
    const _rate = sc_0.loadUintBig(64);
    return { $$type: 'SetMintbackRate' as const, rate: _rate };
}

export function loadTupleSetMintbackRate(source: TupleReader) {
    const _rate = source.readBigNumber();
    return { $$type: 'SetMintbackRate' as const, rate: _rate };
}

export function loadGetterTupleSetMintbackRate(source: TupleReader) {
    const _rate = source.readBigNumber();
    return { $$type: 'SetMintbackRate' as const, rate: _rate };
}

export function storeTupleSetMintbackRate(source: SetMintbackRate) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.rate);
    return builder.build();
}

export function dictValueParserSetMintbackRate(): DictionaryValue<SetMintbackRate> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetMintbackRate(src)).endCell());
        },
        parse: (src) => {
            return loadSetMintbackRate(src.loadRef().beginParse());
        }
    }
}

export type BrandJetton$Data = {
    $$type: 'BrandJetton$Data';
    totalSupply: bigint;
    owner: Address;
    factory: Address;
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    discountPercent: bigint;
    usedNonces: Dictionary<bigint, boolean>;
    proposedRates: Dictionary<Address, bigint>;
    acceptedByPeer: Dictionary<Address, boolean>;
    acceptedFrom: Dictionary<Address, boolean>;
}

export function storeBrandJetton$Data(src: BrandJetton$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.totalSupply);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.factory);
        b_0.storeStringRefTail(src.name);
        b_0.storeStringRefTail(src.symbol);
        const b_1 = new Builder();
        b_1.storeStringRefTail(src.description);
        b_1.storeStringRefTail(src.imageUrl);
        b_1.storeUint(src.discountPercent, 8);
        b_1.storeDict(src.usedNonces, Dictionary.Keys.BigInt(257), Dictionary.Values.Bool());
        const b_2 = new Builder();
        b_2.storeDict(src.proposedRates, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257));
        b_2.storeDict(src.acceptedByPeer, Dictionary.Keys.Address(), Dictionary.Values.Bool());
        b_2.storeDict(src.acceptedFrom, Dictionary.Keys.Address(), Dictionary.Values.Bool());
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadBrandJetton$Data(slice: Slice) {
    const sc_0 = slice;
    const _totalSupply = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _factory = sc_0.loadAddress();
    const _name = sc_0.loadStringRefTail();
    const _symbol = sc_0.loadStringRefTail();
    const sc_1 = sc_0.loadRef().beginParse();
    const _description = sc_1.loadStringRefTail();
    const _imageUrl = sc_1.loadStringRefTail();
    const _discountPercent = sc_1.loadUintBig(8);
    const _usedNonces = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), sc_1);
    const sc_2 = sc_1.loadRef().beginParse();
    const _proposedRates = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), sc_2);
    const _acceptedByPeer = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Bool(), sc_2);
    const _acceptedFrom = Dictionary.load(Dictionary.Keys.Address(), Dictionary.Values.Bool(), sc_2);
    return { $$type: 'BrandJetton$Data' as const, totalSupply: _totalSupply, owner: _owner, factory: _factory, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl, discountPercent: _discountPercent, usedNonces: _usedNonces, proposedRates: _proposedRates, acceptedByPeer: _acceptedByPeer, acceptedFrom: _acceptedFrom };
}

export function loadTupleBrandJetton$Data(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _owner = source.readAddress();
    const _factory = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _description = source.readString();
    const _imageUrl = source.readString();
    const _discountPercent = source.readBigNumber();
    const _usedNonces = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), source.readCellOpt());
    const _proposedRates = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _acceptedByPeer = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    const _acceptedFrom = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    return { $$type: 'BrandJetton$Data' as const, totalSupply: _totalSupply, owner: _owner, factory: _factory, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl, discountPercent: _discountPercent, usedNonces: _usedNonces, proposedRates: _proposedRates, acceptedByPeer: _acceptedByPeer, acceptedFrom: _acceptedFrom };
}

export function loadGetterTupleBrandJetton$Data(source: TupleReader) {
    const _totalSupply = source.readBigNumber();
    const _owner = source.readAddress();
    const _factory = source.readAddress();
    const _name = source.readString();
    const _symbol = source.readString();
    const _description = source.readString();
    const _imageUrl = source.readString();
    const _discountPercent = source.readBigNumber();
    const _usedNonces = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), source.readCellOpt());
    const _proposedRates = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(257), source.readCellOpt());
    const _acceptedByPeer = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    const _acceptedFrom = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool(), source.readCellOpt());
    return { $$type: 'BrandJetton$Data' as const, totalSupply: _totalSupply, owner: _owner, factory: _factory, name: _name, symbol: _symbol, description: _description, imageUrl: _imageUrl, discountPercent: _discountPercent, usedNonces: _usedNonces, proposedRates: _proposedRates, acceptedByPeer: _acceptedByPeer, acceptedFrom: _acceptedFrom };
}

export function storeTupleBrandJetton$Data(source: BrandJetton$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.totalSupply);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.factory);
    builder.writeString(source.name);
    builder.writeString(source.symbol);
    builder.writeString(source.description);
    builder.writeString(source.imageUrl);
    builder.writeNumber(source.discountPercent);
    builder.writeCell(source.usedNonces.size > 0 ? beginCell().storeDictDirect(source.usedNonces, Dictionary.Keys.BigInt(257), Dictionary.Values.Bool()).endCell() : null);
    builder.writeCell(source.proposedRates.size > 0 ? beginCell().storeDictDirect(source.proposedRates, Dictionary.Keys.Address(), Dictionary.Values.BigInt(257)).endCell() : null);
    builder.writeCell(source.acceptedByPeer.size > 0 ? beginCell().storeDictDirect(source.acceptedByPeer, Dictionary.Keys.Address(), Dictionary.Values.Bool()).endCell() : null);
    builder.writeCell(source.acceptedFrom.size > 0 ? beginCell().storeDictDirect(source.acceptedFrom, Dictionary.Keys.Address(), Dictionary.Values.Bool()).endCell() : null);
    return builder.build();
}

export function dictValueParserBrandJetton$Data(): DictionaryValue<BrandJetton$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBrandJetton$Data(src)).endCell());
        },
        parse: (src) => {
            return loadBrandJetton$Data(src.loadRef().beginParse());
        }
    }
}

export type JettonWallet$Data = {
    $$type: 'JettonWallet$Data';
    balance: bigint;
    owner: Address;
    master: Address;
}

export function storeJettonWallet$Data(src: JettonWallet$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeCoins(src.balance);
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.master);
    };
}

export function loadJettonWallet$Data(slice: Slice) {
    const sc_0 = slice;
    const _balance = sc_0.loadCoins();
    const _owner = sc_0.loadAddress();
    const _master = sc_0.loadAddress();
    return { $$type: 'JettonWallet$Data' as const, balance: _balance, owner: _owner, master: _master };
}

export function loadTupleJettonWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _master = source.readAddress();
    return { $$type: 'JettonWallet$Data' as const, balance: _balance, owner: _owner, master: _master };
}

export function loadGetterTupleJettonWallet$Data(source: TupleReader) {
    const _balance = source.readBigNumber();
    const _owner = source.readAddress();
    const _master = source.readAddress();
    return { $$type: 'JettonWallet$Data' as const, balance: _balance, owner: _owner, master: _master };
}

export function storeTupleJettonWallet$Data(source: JettonWallet$Data) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.balance);
    builder.writeAddress(source.owner);
    builder.writeAddress(source.master);
    return builder.build();
}

export function dictValueParserJettonWallet$Data(): DictionaryValue<JettonWallet$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonWallet$Data(src)).endCell());
        },
        parse: (src) => {
            return loadJettonWallet$Data(src.loadRef().beginParse());
        }
    }
}

export type Factory$Data = {
    $$type: 'Factory$Data';
    owner: Address;
    createFee: bigint;
    mintbackRate: bigint;
    brandCount: bigint;
    brands: Dictionary<bigint, Address>;
}

export function storeFactory$Data(src: Factory$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeCoins(src.createFee);
        b_0.storeUint(src.mintbackRate, 64);
        b_0.storeUint(src.brandCount, 64);
        b_0.storeDict(src.brands, Dictionary.Keys.BigInt(257), Dictionary.Values.Address());
    };
}

export function loadFactory$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _createFee = sc_0.loadCoins();
    const _mintbackRate = sc_0.loadUintBig(64);
    const _brandCount = sc_0.loadUintBig(64);
    const _brands = Dictionary.load(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), sc_0);
    return { $$type: 'Factory$Data' as const, owner: _owner, createFee: _createFee, mintbackRate: _mintbackRate, brandCount: _brandCount, brands: _brands };
}

export function loadTupleFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _createFee = source.readBigNumber();
    const _mintbackRate = source.readBigNumber();
    const _brandCount = source.readBigNumber();
    const _brands = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    return { $$type: 'Factory$Data' as const, owner: _owner, createFee: _createFee, mintbackRate: _mintbackRate, brandCount: _brandCount, brands: _brands };
}

export function loadGetterTupleFactory$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _createFee = source.readBigNumber();
    const _mintbackRate = source.readBigNumber();
    const _brandCount = source.readBigNumber();
    const _brands = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), source.readCellOpt());
    return { $$type: 'Factory$Data' as const, owner: _owner, createFee: _createFee, mintbackRate: _mintbackRate, brandCount: _brandCount, brands: _brands };
}

export function storeTupleFactory$Data(source: Factory$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeNumber(source.createFee);
    builder.writeNumber(source.mintbackRate);
    builder.writeNumber(source.brandCount);
    builder.writeCell(source.brands.size > 0 ? beginCell().storeDictDirect(source.brands, Dictionary.Keys.BigInt(257), Dictionary.Values.Address()).endCell() : null);
    return builder.build();
}

export function dictValueParserFactory$Data(): DictionaryValue<Factory$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactory$Data(src)).endCell());
        },
        parse: (src) => {
            return loadFactory$Data(src.loadRef().beginParse());
        }
    }
}

 type JettonWallet_init_args = {
    $$type: 'JettonWallet_init_args';
    owner: Address;
    master: Address;
}

function initJettonWallet_init_args(src: JettonWallet_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeAddress(src.master);
    };
}

async function JettonWallet_init(owner: Address, master: Address) {
    const __code = Cell.fromHex('b5ee9c72410219010004a600022cff008e88f4a413f4bcf2c80bed53208e8130e1ed43d9010c020271020702015803050147b4a3bda89a1a4000335f401f481f480aa40d82735f481f480b205a202e0b3c5b678d8630040002210147b7605da89a1a4000335f401f481f480aa40d82735f481f480b205a202e0b3c5b678d86900601125cdb3c30546330523014020120080a0147b96c0ed44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e2db3c6c318090002220147b95bded44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e2db3c6c3180b00022004b401d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019afa00fa40fa4055206c139afa40fa405902d1017059e204e30202d70d1ff2e082218210178d4519bae3022182100f8a7ea5bae302018210595f07bcba0d0e121500b6028020d7217021d749c21f9430d31f01de208210178d4519ba8e1a30d33ffa00596c21a002c87f01ca0055205afa0212cecec9ed54e082107bdd97deba8e19d33ffa00596c21a002c87f01ca0055205afa0212cecec9ed54e05f0404e631d33ffa00fa40d72c01916d93fa4001e201fa00f8416f2410235f035349db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d082009ee1532bc705936c217f9359c705e2f2f45164a001c200e3026c2233206eb3915be30d02140f101100d6310370705043804007c8553082107362d09c5005cb1f13cb3f01fa02cecec925045055146d50436d5033c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002c87f01ca0055205afa0212cecec9ed5400a6206ef2d0807070804004c8018210d53276db58cb1fcb3fc910344130146d50436d5033c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb000020c87f01ca0055205afa0212cecec9ed5402fa31d33ffa00fa40d72c01916d93fa4001e201f40431fa00f8416f24303282009058511ac705f2f48200d5575386bef2f48200cfa401820afaf080bef2f45164a15338db3c705920f90022f9005ad76501d76582020134c8cb17cb0fcb0fcbffcbff71f90400c87401cb0212ca07cbffc9d05065707f80402b4713506bc8141302fa55508210178d45195007cb1f15cb3f5003fa02ce01206e9430cf84809201cee201fa02cec95338db3c305149db3c3110561057103441301036453304c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0002c87f01ca0055205afa0212cecec9ed5414140018f82ac87001ca005a02cecec9010ee3025f04f2c0821602fed33ffa00d72c01916d93fa4001e231f8416f245b8154273226c705f2f48200d5575342bef2f45131a1707f541436804007c8553082107bdd97de5005cb1f13cb3f01fa02ce01206e9430cf84809201cee2c9260443135055146d50436d5033c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf818ae2f400c91718001a58cf8680cf8480f400f400cf81002801fb0002c87f01ca0055205afa0212cecec9ed547772fe30');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initJettonWallet_init_args({ $$type: 'JettonWallet_init_args', owner, master })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const JettonWallet_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    9865: { message: "No accepted rate from source" },
    14036: { message: "No rate proposed for target" },
    17091: { message: "Nonce already used" },
    21360: { message: "No proposal exists for this brand" },
    21543: { message: "Only owner can burn" },
    22524: { message: "Target has not accepted rate" },
    23596: { message: "Missing targetBrand" },
    24321: { message: "Invalid percent" },
    27818: { message: "Rate must be positive" },
    35499: { message: "Only owner" },
    36088: { message: "Invalid wallet" },
    36952: { message: "Only owner can transfer" },
    39925: { message: "Unauthorized mint" },
    40561: { message: "Sender must be fromBrand" },
    40673: { message: "Unauthorized sender" },
    42967: { message: "Swap amount too small" },
    45925: { message: "Missing nonce" },
    48744: { message: "Sender must be sourceBrand" },
    53156: { message: "Insufficient TON for fees" },
    54615: { message: "Insufficient balance" },
    55259: { message: "Insufficient fee" },
} as const

export const JettonWallet_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "No accepted rate from source": 9865,
    "No rate proposed for target": 14036,
    "Nonce already used": 17091,
    "No proposal exists for this brand": 21360,
    "Only owner can burn": 21543,
    "Target has not accepted rate": 22524,
    "Missing targetBrand": 23596,
    "Invalid percent": 24321,
    "Rate must be positive": 27818,
    "Only owner": 35499,
    "Invalid wallet": 36088,
    "Only owner can transfer": 36952,
    "Unauthorized mint": 39925,
    "Sender must be fromBrand": 40561,
    "Unauthorized sender": 40673,
    "Swap amount too small": 42967,
    "Missing nonce": 45925,
    "Sender must be sourceBrand": 48744,
    "Insufficient TON for fees": 53156,
    "Insufficient balance": 54615,
    "Insufficient fee": 55259,
} as const

const JettonWallet_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"TokenTransfer","header":260734629,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forwardTonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"TokenTransferInternal","header":395134233,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"from","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseAddress","type":{"kind":"simple","type":"address","optional":true}},{"name":"forwardTonAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"TransferNotification","header":1935855772,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forwardPayload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"TokenBurn","header":1499400124,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}},{"name":"customPayload","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"TokenBurnNotification","header":2078119902,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"responseDestination","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"TokenExcesses","header":3576854235,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"JettonData","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}},{"name":"description","type":{"kind":"simple","type":"string","optional":false}},{"name":"imageUrl","type":{"kind":"simple","type":"string","optional":false}}]},
    {"name":"JettonMasterData","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"mintable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"adminAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonContent","type":{"kind":"simple","type":"cell","optional":false}},{"name":"jettonWalletCode","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"JettonWalletData","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"ownerAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonMasterAddress","type":{"kind":"simple","type":"address","optional":false}},{"name":"jettonWalletCode","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"MintTo","header":4095612892,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"SwapMint","header":1238517432,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sourceBrand","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"SetDiscountPercent","header":3310276447,"fields":[{"name":"percent","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"ProposeRate","header":848762246,"fields":[{"name":"targetBrand","type":{"kind":"simple","type":"address","optional":false}},{"name":"rate","type":{"kind":"simple","type":"uint","optional":false,"format":32}}]},
    {"name":"AcceptRate","header":1554609579,"fields":[{"name":"sourceBrand","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"RateAccepted","header":1695163564,"fields":[{"name":"fromBrand","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"RevokeRate","header":2108943833,"fields":[{"name":"peerBrand","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"CreateBrand","header":619442111,"fields":[{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}},{"name":"description","type":{"kind":"simple","type":"string","optional":false}},{"name":"imageUrl","type":{"kind":"simple","type":"string","optional":false}}]},
    {"name":"SetCreateFee","header":3354333758,"fields":[{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"SetMintbackRate","header":2186379215,"fields":[{"name":"rate","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"BrandJetton$Data","header":null,"fields":[{"name":"totalSupply","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"factory","type":{"kind":"simple","type":"address","optional":false}},{"name":"name","type":{"kind":"simple","type":"string","optional":false}},{"name":"symbol","type":{"kind":"simple","type":"string","optional":false}},{"name":"description","type":{"kind":"simple","type":"string","optional":false}},{"name":"imageUrl","type":{"kind":"simple","type":"string","optional":false}},{"name":"discountPercent","type":{"kind":"simple","type":"uint","optional":false,"format":8}},{"name":"usedNonces","type":{"kind":"dict","key":"int","value":"bool"}},{"name":"proposedRates","type":{"kind":"dict","key":"address","value":"int"}},{"name":"acceptedByPeer","type":{"kind":"dict","key":"address","value":"bool"}},{"name":"acceptedFrom","type":{"kind":"dict","key":"address","value":"bool"}}]},
    {"name":"JettonWallet$Data","header":null,"fields":[{"name":"balance","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"master","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Factory$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"createFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"mintbackRate","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"brandCount","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"brands","type":{"kind":"dict","key":"int","value":"address"}}]},
]

const JettonWallet_opcodes = {
    "TokenTransfer": 260734629,
    "TokenTransferInternal": 395134233,
    "TransferNotification": 1935855772,
    "TokenBurn": 1499400124,
    "TokenBurnNotification": 2078119902,
    "TokenExcesses": 3576854235,
    "MintTo": 4095612892,
    "SwapMint": 1238517432,
    "SetDiscountPercent": 3310276447,
    "ProposeRate": 848762246,
    "AcceptRate": 1554609579,
    "RateAccepted": 1695163564,
    "RevokeRate": 2108943833,
    "CreateBrand": 619442111,
    "SetCreateFee": 3354333758,
    "SetMintbackRate": 2186379215,
}

const JettonWallet_getters: ABIGetter[] = [
    {"name":"balance","methodId":104128,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"master","methodId":120253,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"get_wallet_data","methodId":97026,"arguments":[],"returnType":{"kind":"simple","type":"JettonWalletData","optional":false}},
]

export const JettonWallet_getterMapping: { [key: string]: string } = {
    'balance': 'getBalance',
    'owner': 'getOwner',
    'master': 'getMaster',
    'get_wallet_data': 'getGetWalletData',
}

const JettonWallet_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"TokenTransferInternal"}},
    {"receiver":"internal","message":{"kind":"typed","type":"TokenTransfer"}},
    {"receiver":"internal","message":{"kind":"typed","type":"TokenBurn"}},
]


export class JettonWallet implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = JettonWallet_errors_backward;
    public static readonly opcodes = JettonWallet_opcodes;
    
    static async init(owner: Address, master: Address) {
        return await JettonWallet_init(owner, master);
    }
    
    static async fromInit(owner: Address, master: Address) {
        const __gen_init = await JettonWallet_init(owner, master);
        const address = contractAddress(0, __gen_init);
        return new JettonWallet(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new JettonWallet(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  JettonWallet_types,
        getters: JettonWallet_getters,
        receivers: JettonWallet_receivers,
        errors: JettonWallet_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: TokenTransferInternal | TokenTransfer | TokenBurn) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'TokenTransferInternal') {
            body = beginCell().store(storeTokenTransferInternal(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'TokenTransfer') {
            body = beginCell().store(storeTokenTransfer(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'TokenBurn') {
            body = beginCell().store(storeTokenBurn(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('balance', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getMaster(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('master', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getGetWalletData(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_wallet_data', builder.build())).stack;
        const result = loadGetterTupleJettonWalletData(source);
        return result;
    }
    
}