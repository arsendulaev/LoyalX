import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import {
  initDb,
  upsertRegistration,
  upsertProposalSnapshot,
  markActivePairNotified,
  pool,
} from '../db';

interface LegacyDb {
  registrations?: Record<string, { walletAddress: string; chatId: string; brandAddresses: string[] }>;
  proposalSnapshots?: Record<string, Record<string, { rate: number; notifiedIncoming: boolean }>>;
  activePairSnapshots?: Record<string, Record<string, boolean>>;
}

async function main(): Promise<void> {
  const filePath = process.env.IMPORT_FILE
    ? path.resolve(process.env.IMPORT_FILE)
    : path.join(__dirname, '../../notify.json');

  if (!fs.existsSync(filePath)) {
    console.log(`[import] No file at ${filePath} — nothing to import. Exiting.`);
    await pool.end();
    return;
  }

  console.log(`[import] Reading ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LegacyDb;

  await initDb();

  let regCount = 0;
  let propCount = 0;
  let pairCount = 0;

  for (const reg of Object.values(raw.registrations ?? {})) {
    await upsertRegistration(reg);
    regCount += 1;
  }

  for (const [brand, byProposer] of Object.entries(raw.proposalSnapshots ?? {})) {
    for (const [proposer, snap] of Object.entries(byProposer)) {
      await upsertProposalSnapshot(brand, proposer, snap.rate, snap.notifiedIncoming);
      propCount += 1;
    }
  }

  for (const [from, byTo] of Object.entries(raw.activePairSnapshots ?? {})) {
    for (const [to, flag] of Object.entries(byTo)) {
      if (flag) {
        await markActivePairNotified(from, to);
        pairCount += 1;
      }
    }
  }

  console.log(
    `[import] Done. registrations=${regCount} proposalSnapshots=${propCount} activePairs=${pairCount}`
  );
  await pool.end();
}

main().catch(async (e) => {
  console.error('[import] Failed:', e);
  await pool.end();
  process.exit(1);
});
