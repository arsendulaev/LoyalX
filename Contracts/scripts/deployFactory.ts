import { toNano, beginCell } from '@ton/core';
import { Factory } from '../build/factory/factory_Factory';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const owner = provider.sender().address!;
    const createFee = toNano('1');
    const mintbackRate = 1000n;

    console.log('Deploying Factory...');
    console.log('Owner:', owner.toString());
    console.log('Create fee:', createFee.toString(), 'nanoton');
    console.log('Mintback rate:', mintbackRate.toString());

    const factory = provider.open(await Factory.fromInit(owner, createFee, mintbackRate));

    await factory.send(
        provider.sender(),
        { value: toNano('0.1') },
        null
    );

    await provider.waitForDeploy(factory.address);

    console.log('Factory deployed at:', factory.address.toString());
}
