import { getAllRegistrations, isProposalNotified, upsertProposalSnapshot, isActivePairNotified, markActivePairNotified } from './db';
import { sendTelegramMessage, formatMessage } from './telegram';

const TONAPI_BASE = 'https://testnet.tonapi.io/v2';
const TONAPI_KEY = process.env.TONAPI_KEY;
const POLL_INTERVAL_MS = 60_000;

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
  try {
    const res = await runGetMethod(brandAddress, 'getIncomingProposals');
    const stackItem = res.stack?.[0];
    if (!stackItem || stackItem.type === 'null') return result;

    const cellHex: string = stackItem.cell ?? stackItem.slice;
    if (!cellHex) return result;

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
  } catch (e) {
    console.error(`getIncomingProposals(${brandAddress}):`, e);
  }
  return result;
}

async function getActivePairs(fromBrand: string, otherBrands: string[]): Promise<Set<string>> {
  const active = new Set<string>();
  await Promise.all(
    otherBrands.filter(t => t !== fromBrand).map(async (target) => {
      try {
        const res = await runGetMethod(fromBrand, 'swapActive', [target]);
        const isActive = !!parseInt(res.stack?.[0]?.num ?? '0x0', 16);
        if (isActive) active.add(target);
      } catch {}
    })
  );
  return active;
}

async function pollOnce(): Promise<void> {
  const registrations = await getAllRegistrations();
  if (registrations.length === 0) return;

  for (const reg of registrations) {
    for (const brandAddress of reg.brandAddresses) {
      try {
        const proposals = await getIncomingProposals(brandAddress);
        for (const [proposerAddr, rate] of proposals) {
          const alreadyNotified = await isProposalNotified(brandAddress, proposerAddr);
          await upsertProposalSnapshot(brandAddress, proposerAddr, rate, true);

          if (!alreadyNotified) {
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
            await sendTelegramMessage(reg.chatId, text);
            console.log(`[poller] Sent incoming_proposal to ${reg.chatId}`);
          }
        }

        const allBrands = registrations.flatMap(r => r.brandAddresses).filter(b => b !== brandAddress);
        const uniqueTargets = [...new Set(allBrands)];

        const activePairs = await getActivePairs(brandAddress, uniqueTargets);
        for (const targetAddr of activePairs) {
          const alreadyNotified = await isActivePairNotified(brandAddress, targetAddr);
          if (!alreadyNotified) {
            const ourProposalToTarget = proposals.has(targetAddr);
            if (!ourProposalToTarget) {
              await markActivePairNotified(brandAddress, targetAddr);
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
              await sendTelegramMessage(reg.chatId, text);
              console.log(`[poller] Sent accepted_outgoing to ${reg.chatId}`);
            } else {
              await markActivePairNotified(brandAddress, targetAddr);
            }
          }
        }
      } catch (e) {
        console.error(`[poller] Error for brand ${brandAddress}:`, e);
      }
    }
  }
}

export function startPoller(): void {
  console.log(`[poller] Starting, interval=${POLL_INTERVAL_MS / 1000}s`);
  pollOnce().catch(console.error);
  setInterval(() => pollOnce().catch(console.error), POLL_INTERVAL_MS);
}
