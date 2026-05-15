import {
  getBrandRegistrations,
  isProposalNotified,
  upsertProposalSnapshot,
  isActivePairNotified,
  markActivePairNotified,
  markBrandSeeded,
} from './db';
import { sendTelegramMessage, formatMessage } from './telegram';

const TONAPI_BASE = 'https://testnet.tonapi.io/v2';
const TONAPI_KEY = process.env.TONAPI_KEY;
const POLL_INTERVAL_MS = 60_000;
const SWAP_ACTIVE_CONCURRENCY = 2;

if (!TONAPI_KEY) {
  console.warn('[poller] TONAPI_KEY is not set — rate limits will be very low and you will see 429s.');
}

async function tonApiGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (TONAPI_KEY) headers['Authorization'] = `Bearer ${TONAPI_KEY}`;
  const res = await fetch(`${TONAPI_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`TonAPI ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function runGetMethod(accountId: string, method: string, args: string[] = []): Promise<any> {
  const query = args.length ? `?args=${args.map(encodeURIComponent).join(',')}` : '';
  return tonApiGet<any>(`/blockchain/accounts/${encodeURIComponent(accountId)}/methods/${method}${query}`);
}

async function getJettonName(masterAddress: string): Promise<string> {
  try {
    const info = await tonApiGet<any>(`/jettons/${encodeURIComponent(masterAddress)}`);
    return info?.metadata?.symbol ?? masterAddress.slice(0, 8) + '…';
  } catch {
    return masterAddress.slice(0, 8) + '…';
  }
}

async function getIncomingProposals(brandAddress: string): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const res = await runGetMethod(brandAddress, 'getIncomingProposals');
  const stackItem = res.stack?.[0];
  if (!stackItem || stackItem.type === 'null') return result;

  const entries: Array<{ key: string; value: string }> = stackItem.entries ?? [];
  for (const entry of entries) {
    const proposerAddr = entry.key;
    const rate = parseInt(entry.value, 16);
    if (proposerAddr && rate > 0) result.set(proposerAddr, rate);
  }

  if (result.size === 0 && res.decoded) {
    for (const [k, v] of Object.entries(res.decoded ?? {})) {
      result.set(k, Number(v));
    }
  }
  return result;
}

async function getActivePairs(fromBrand: string, otherBrands: string[]): Promise<Set<string>> {
  const active = new Set<string>();
  const targets = otherBrands.filter(t => t !== fromBrand);
  for (let i = 0; i < targets.length; i += SWAP_ACTIVE_CONCURRENCY) {
    const batch = targets.slice(i, i + SWAP_ACTIVE_CONCURRENCY);
    await Promise.all(batch.map(async (target) => {
      try {
        const res = await runGetMethod(fromBrand, 'swapActive', [target]);
        const isActive = !!parseInt(res.stack?.[0]?.num ?? '0x0', 16);
        if (isActive) active.add(target);
      } catch (e) {
        throw e;
      }
    }));
  }
  return active;
}

interface BrandTask {
  walletAddress: string;
  chatId: string;
  brandAddress: string;
  seeded: boolean;
}

async function processBrand(task: BrandTask, allBrands: string[]): Promise<void> {
  const { walletAddress, chatId, brandAddress, seeded } = task;

  let proposals: Map<string, number>;
  try {
    proposals = await getIncomingProposals(brandAddress);
  } catch (e) {
    console.error(`[poller] getIncomingProposals(${brandAddress}) failed, skipping brand:`, (e as Error).message);
    return;
  }

  for (const [proposerAddr, rate] of proposals) {
    const alreadyNotified = await isProposalNotified(brandAddress, proposerAddr);
    await upsertProposalSnapshot(brandAddress, proposerAddr, rate, true);

    if (!alreadyNotified && seeded) {
      const [mySymbol, proposerSymbol] = await Promise.all([
        getJettonName(brandAddress),
        getJettonName(proposerAddr),
      ]);
      const text = formatMessage('rate_accepted_incoming', {
        myBrand: brandAddress,
        mySymbol,
        proposer: proposerAddr,
        proposerSymbol,
      });
      await sendTelegramMessage(chatId, text);
      console.log(`[poller] Sent incoming_proposal to ${chatId}`);
    }
  }

  const uniqueTargets = [...new Set(allBrands.filter(b => b !== brandAddress))];
  let activePairs: Set<string>;
  try {
    activePairs = await getActivePairs(brandAddress, uniqueTargets);
  } catch (e) {
    console.error(`[poller] getActivePairs(${brandAddress}) failed, skipping pair detection:`, (e as Error).message);
    return;
  }

  for (const targetAddr of activePairs) {
    const alreadyNotified = await isActivePairNotified(brandAddress, targetAddr);
    if (!alreadyNotified) {
      const ourProposalToTarget = proposals.has(targetAddr);
      await markActivePairNotified(brandAddress, targetAddr);
      if (!ourProposalToTarget && seeded) {
        const [mySymbol, acceptorSymbol] = await Promise.all([
          getJettonName(brandAddress),
          getJettonName(targetAddr),
        ]);
        const text = formatMessage('rate_accepted_outgoing', {
          myBrand: brandAddress,
          mySymbol,
          acceptor: targetAddr,
          acceptorSymbol,
        });
        await sendTelegramMessage(chatId, text);
        console.log(`[poller] Sent accepted_outgoing to ${chatId}`);
      }
    }
  }

  if (!seeded) {
    await markBrandSeeded(walletAddress, brandAddress);
    console.log(`[poller] Seeded brand ${brandAddress} for wallet ${walletAddress} (no notifications sent)`);
  }
}

async function pollOnce(): Promise<void> {
  const brandRegs = await getBrandRegistrations();
  if (brandRegs.length === 0) return;

  const allBrands = brandRegs.map(b => b.brandAddress);

  for (const task of brandRegs) {
    try {
      await processBrand(task, allBrands);
    } catch (e) {
      console.error(`[poller] Unexpected error for brand ${task.brandAddress}:`, e);
    }
  }
}

export function startPoller(): void {
  console.log(`[poller] Starting, interval=${POLL_INTERVAL_MS / 1000}s`);
  pollOnce().catch(console.error);
  setInterval(() => pollOnce().catch(console.error), POLL_INTERVAL_MS);
}
