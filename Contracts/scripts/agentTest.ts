import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { TonClient, WalletContractV4, internal, SendMode } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { Address, toNano, beginCell } from '@ton/core';
import { storeCreateBrand } from '../build/factory/factory_Factory';
import { storeMintTo } from '../build/brand_jetton/brand_jetton_BrandJetton';
import { Factory } from '../build/factory/factory_Factory';
import { BrandJetton } from '../build/brand_jetton/brand_jetton_BrandJetton';
import { JettonWallet } from '../build/brand_jetton/brand_jetton_JettonWallet';

const TESTNET_API = 'https://testnet.toncenter.com/api/v2/jsonRPC';

function getClient() {
    return new TonClient({ endpoint: TESTNET_API, apiKey: process.env.TONCENTER_API_KEY || undefined });
}

async function getWallet(client: TonClient) {
    const mnemonic = process.env.AGENT_MNEMONIC;
    if (!mnemonic) throw new Error('AGENT_MNEMONIC not set in .env');
    const kp = await mnemonicToPrivateKey(mnemonic.trim().split(/\s+/));
    const wallet = WalletContractV4.create({ publicKey: kp.publicKey, workchain: 0 });
    return { wallet, kp, contract: client.open(wallet) };
}

function getFactoryAddress(): Address {
    const addr = process.env.VITE_FACTORY_ADDRESS || process.env.FACTORY_ADDRESS;
    if (!addr) throw new Error('Set VITE_FACTORY_ADDRESS in .env');
    return Address.parse(addr);
}

async function info() {
    const client = getClient();
    const { wallet, contract } = await getWallet(client);
    const addr = wallet.address.toString({ urlSafe: true, bounceable: false, testOnly: true });
    let balance = 0n, state = 'uninit';
    try { const cs = await client.getContractState(wallet.address); balance = cs.balance; state = cs.state; } catch {}

    console.log('=== Agent Wallet (testnet) ===');
    console.log('Address:', addr);
    console.log('Balance:', Number(balance) / 1e9, 'TON');
    console.log('State  :', state);

    if (state === 'uninit') {
        console.log('\n⚠️  Send TON to activate:', addr);
        return;
    }

    const seqno = await contract.getSeqno();
    console.log('Seqno  :', seqno);

    const factoryAddr = process.env.VITE_FACTORY_ADDRESS || process.env.FACTORY_ADDRESS;
    if (factoryAddr) {
        console.log('\nFactory:', factoryAddr);
        const factory = client.open(Factory.fromAddress(Address.parse(factoryAddr)));
        const count = await factory.getBrandCount();
        console.log('Brands :', count.toString());
        for (let i = 0n; i < count; i++) {
            const bAddr = await factory.getBrandAddress(i);
            if (!bAddr) continue;
            const brand = client.open(BrandJetton.fromAddress(bAddr));
            const data = await brand.getData();
            console.log(' ', i + ':', data.name, '(' + data.symbol + ')', 'supply=' + Number(data.totalSupply)/1e9);
        }
    }
}

async function createBrand(name: string, symbol: string, description: string) {
    const client = getClient();
    const { kp, contract } = await getWallet(client);
    const factory = getFactoryAddress();

    const body = beginCell().store(storeCreateBrand({
        $$type: 'CreateBrand',
        name,
        symbol,
        description,
        imageUrl: '',
    })).endCell();

    const seqno = await contract.getSeqno();
    await contract.sendTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [ internal({ to: factory, value: toNano('1.2'), body, bounce: true }) ],
    });

    console.log('✅ CreateBrand sent!');
    console.log('   Name   :', name);
    console.log('   Symbol :', symbol);
    console.log('   Factory:', factory.toString());
    console.log('   Wait 15s then run: npx ts-node scripts/agentTest.ts info');
}

async function mintTokens(brandAddress: string, amount: number) {
    const client = getClient();
    const { wallet, kp, contract } = await getWallet(client);
    const brand = Address.parse(brandAddress);

    const body = beginCell().store(storeMintTo({
        $$type: 'MintTo',
        queryId: 0n,
        to: wallet.address,
        amount: BigInt(amount) * 1_000_000_000n,
    })).endCell();

    const seqno = await contract.getSeqno();
    await contract.sendTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [ internal({ to: brand, value: toNano('0.25'), body, bounce: true }) ],
    });

    console.log('✅ Mint sent!');
    console.log('   Brand :', brandAddress);
    console.log('   Amount:', amount, 'tokens');
}

async function checkBalance(brandAddress: string) {
    const client = getClient();
    const { wallet } = await getWallet(client);
    const brand = client.open(BrandJetton.fromAddress(Address.parse(brandAddress)));
    const walletAddr = await brand.getWalletAddress(wallet.address);
    console.log('JettonWallet:', walletAddr.toString());
    try {
        const jw = client.open(JettonWallet.fromAddress(walletAddr));
        const bal = await jw.getBalance();
        console.log('Balance:', Number(bal)/1e9, 'tokens');
    } catch { console.log('Balance: 0 (wallet not deployed)'); }
}

async function main() {
    const [,, cmd, ...args] = process.argv;
    switch (cmd ?? 'info') {
        case 'info':    await info(); break;
        case 'create':  await createBrand(args[0] ?? 'TestBrand', args[1] ?? 'TBR', args[2] ?? 'Test brand'); break;
        case 'mint':    if (!args[0]) throw new Error('Usage: mint <brandAddress> <amount>'); await mintTokens(args[0], Number(args[1] ?? 100)); break;
        case 'balance': if (!args[0]) throw new Error('Usage: balance <brandAddress>'); await checkBalance(args[0]); break;
        default: console.log('Commands: info | create <name> <symbol> <description> | mint <brandAddress> <amount> | balance <brandAddress>');
    }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
