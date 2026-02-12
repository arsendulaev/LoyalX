import { toNano } from '@ton/core';
import { Factory } from '../wrappers/Factory';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const factory = provider.open(await Factory.fromInit());

    await factory.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(factory.address);

    console.log('✅ Factory deployed at:', factory.address.toString());
    console.log('');
    console.log('📝 Сохраните этот адрес! Он понадобится для frontend.');
    console.log('');
    console.log('Следующие шаги:');
    console.log('1. Скопируйте адрес Factory');
    console.log('2. Добавьте его в .env frontend: VITE_FACTORY_ADDRESS=<адрес>');
    console.log('3. Проверьте деплой в explorer: https://testnet.tonscan.org/address/' + factory.address.toString());
}
