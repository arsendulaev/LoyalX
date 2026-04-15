const TONAPI_BASE = 'https://testnet.tonapi.io/v2';
const TONAPI_KEY = import.meta.env.VITE_TONAPI_KEY as string | undefined;

export interface JettonMetadata {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  admin: string | null;
  totalSupply: string;
}

export interface UserJetton {
  masterAddress: string;
  balance: string;
  name: string;
  symbol: string;
  image: string;
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function tonApiGet<T>(path: string, attempts = 4): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (TONAPI_KEY) headers['Authorization'] = `Bearer ${TONAPI_KEY}`;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${TONAPI_BASE}${path}`, { headers });
    if (res.ok) return res.json() as Promise<T>;
    if (res.status === 429 || res.status >= 500) {
      if (i < attempts - 1) {
        await sleep(500 * (i + 1));
        continue;
      }
    }
    throw new Error(`TonAPI ${res.status}: ${path}`);
  }
  throw new Error(`TonAPI: all attempts failed: ${path}`);
}

export async function getJettonInfo(masterAddress: string): Promise<JettonMetadata | null> {
  try {
    const data = await tonApiGet<any>(`/jettons/${encodeURIComponent(masterAddress)}`);
    return {
      address: masterAddress,
      name: data.metadata?.name ?? '',
      symbol: data.metadata?.symbol ?? '',
      description: data.metadata?.description ?? '',
      image: data.metadata?.image ?? '',
      admin: data.admin?.address ?? null,
      totalSupply: data.total_supply ?? '0',
    };
  } catch (e) {
    console.error('getJettonInfo failed for', masterAddress, e);
    return null;
  }
}

export async function getBatchJettonInfo(masterAddresses: string[]): Promise<Map<string, JettonMetadata>> {
  const result = new Map<string, JettonMetadata>();
  const CHUNK = 5;
  for (let i = 0; i < masterAddresses.length; i += CHUNK) {
    if (i > 0) await sleep(300);
    const chunk = masterAddresses.slice(i, i + CHUNK);
    const infos = await Promise.all(chunk.map(addr => getJettonInfo(addr)));
    infos.forEach((info, idx) => {
      if (info) result.set(chunk[idx], info);
    });
  }
  return result;
}

export async function getUserJettons(userAddress: string): Promise<UserJetton[]> {
  const data = await tonApiGet<any>(`/accounts/${encodeURIComponent(userAddress)}/jettons`);
  return (data.balances ?? []).map((b: any) => ({
    masterAddress: b.jetton?.address ?? '',
    balance: b.balance ?? '0',
    name: b.jetton?.name ?? '',
    symbol: b.jetton?.symbol ?? '',
    image: b.jetton?.image ?? '',
  }));
}

export async function runGetMethod(accountId: string, method: string, args: string[] = []): Promise<any> {
  const query = args.length ? `?args=${args.map(encodeURIComponent).join(',')}` : '';
  return tonApiGet<any>(`/blockchain/accounts/${encodeURIComponent(accountId)}/methods/${method}${query}`);
}

export type TxType = 'Mint' | 'Burn' | 'Swap' | 'Transfer';

export interface Transaction {
  id: string;
  type: TxType;
  tokenName: string;
  tokenSymbol: string;
  amount: string;
  sign: '+' | '-';
  date: string;
  status: 'success' | 'failed';
  explorerUrl: string;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]}, ${h}:${m}`;
}

function toRaw(addr: string): string {
  try {
    if (addr.startsWith('0:') || addr.includes(':')) return addr.toLowerCase();
    const b64 = addr.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    if (bytes.length < 36) return addr.toLowerCase();
    const wc = bytes[1] === 0xff ? -1 : bytes[1];
    const hash = Array.from(bytes.slice(2, 34)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${wc}:${hash}`;
  } catch {
    return addr.toLowerCase();
  }
}

export async function getTransactionHistory(userAddress: string): Promise<Transaction[]> {
  const data = await tonApiGet<any>(`/accounts/${encodeURIComponent(userAddress)}/events?limit=50`);
  const events: any[] = data.events ?? [];
  const norm = toRaw(userAddress);

  const txs: Transaction[] = [];
  for (const event of events) {
    const actions: any[] = event.actions ?? [];
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionType: string = action.type ?? '';

      let jt: any = null;
      let type: TxType = 'Transfer';
      let sign: '+' | '-' = '+';

      if (actionType === 'JettonMint') {
        jt = action.JettonMint;
        type = 'Mint';
        sign = '+';
      } else if (actionType === 'JettonBurn') {
        jt = action.JettonBurn;
        type = 'Burn';
        sign = '-';
      } else if (actionType === 'JettonSwap') {
        jt = action.JettonSwap;
        type = 'Swap';
        const outAddr = (jt?.user_wallet?.address ?? '').toLowerCase();
        sign = outAddr === norm ? '-' : '+';
      } else if (actionType === 'JettonTransfer') {
        jt = action.JettonTransfer;
        type = 'Transfer';
        const recipient = (jt?.recipient?.address ?? '').toLowerCase();
        sign = recipient === norm ? '+' : '-';
      } else {
        continue;
      }

      if (!jt) continue;

      const jetton = jt.jetton ?? jt.jetton_master ?? jt.in ?? {};
      const decimals = Number(jetton.decimals ?? 9);
      const rawAmount = BigInt(jt.amount ?? jt.ton_in ?? jt.amount_in ?? '0');
      const amount = (Number(rawAmount) / Math.pow(10, decimals)).toLocaleString('ru', { maximumFractionDigits: 4 });

      txs.push({
        id: `${event.event_id}-${i}`,
        type,
        tokenName: jetton.name ?? jetton.symbol ?? 'Unknown',
        tokenSymbol: jetton.symbol ?? '',
        amount,
        sign,
        date: formatDate(event.timestamp),
        status: (action.status ?? 'ok') === 'ok' ? 'success' : 'failed',
        explorerUrl: `https://testnet.tonviewer.com/transaction/${event.event_id}`,
      });
    }
  }
  return txs;
}
