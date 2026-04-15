import { toNano, TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { Factory } from './build/factory/factory_Factory';

const TESTNET_API = 'https://testnet.toncenter.com/api/v2/jsonRPC';

async function main() {
    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) {
        console.error('Set MNEMONIC env variable (space-separated seed words)');
        process.exit(1);
    }

    const words = mnemonic.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(words);

    const client = new TonClient({ endpoint: TESTNET_API });
    const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
    const contract = client.open(wallet);

    const createFee = toNano('1');
    const mintbackRate = 1000n;
    const owner = wallet.address;

    console.log('Deploying with wallet:', owner.toString());

    const factoryInit = await Factory.fromInit(owner, createFee, mintbackRate);
    const factory = client.open(factoryInit);

    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
        secretKey: keyPair.secretKey,
        seqno,
        messages: [
            internal({
                to: factory.address,
                value: toNano('0.2'),
                init: factoryInit.init,
                bounce: false,
            }),
        ],
        sendMode: 3,
    });

    console.log('Transaction sent. Factory address:');
    console.log(factory.address.toString());
    console.log('');
    console.log('Add to tgapp/.env:');
}

main().catch(console.error);
