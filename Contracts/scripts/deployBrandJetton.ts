import { toNano } from '@ton/core';
import { BrandJetton } from '../build/BrandJetton/BrandJetton_BrandJetton';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const brandJetton = provider.open(await BrandJetton.fromInit());

    await brandJetton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(brandJetton.address);

    // run methods on `brandJetton`
}
