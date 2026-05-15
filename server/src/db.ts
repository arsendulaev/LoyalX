import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[db] DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => console.error('[db] pool error:', err));

export async function initDb(): Promise<void> {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await pool.query(sql);
  }
  console.log('[db] Connected to Postgres, schema ready');
}

export interface Registration {
  walletAddress: string;
  chatId: string;
  brandAddresses: string[];
}

export interface BrandRegistration {
  walletAddress: string;
  chatId: string;
  brandAddress: string;
  seeded: boolean;
}

export async function upsertRegistration(reg: Registration): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO registrations (wallet_address, chat_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (wallet_address)
       DO UPDATE SET chat_id = EXCLUDED.chat_id, updated_at = NOW()`,
      [reg.walletAddress, reg.chatId]
    );
    await client.query(
      `DELETE FROM registration_brands WHERE wallet_address = $1`,
      [reg.walletAddress]
    );
    if (reg.brandAddresses.length > 0) {
      const values: string[] = [];
      const params: string[] = [];
      reg.brandAddresses.forEach((brand, i) => {
        values.push(`($1, $${i + 2})`);
        params.push(brand);
      });
      await client.query(
        `INSERT INTO registration_brands (wallet_address, brand_address)
         VALUES ${values.join(', ')}
         ON CONFLICT DO NOTHING`,
        [reg.walletAddress, ...params]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const { rows } = await pool.query<{
    wallet_address: string;
    chat_id: string;
    brand_addresses: string[] | null;
  }>(
    `SELECT r.wallet_address,
            r.chat_id,
            COALESCE(ARRAY_AGG(b.brand_address) FILTER (WHERE b.brand_address IS NOT NULL), '{}') AS brand_addresses
     FROM registrations r
     LEFT JOIN registration_brands b ON b.wallet_address = r.wallet_address
     GROUP BY r.wallet_address, r.chat_id`
  );
  return rows.map((r) => ({
    walletAddress: r.wallet_address,
    chatId: r.chat_id,
    brandAddresses: r.brand_addresses ?? [],
  }));
}

export async function getBrandRegistrations(): Promise<BrandRegistration[]> {
  const { rows } = await pool.query<{
    wallet_address: string;
    chat_id: string;
    brand_address: string;
    seeded: boolean;
  }>(
    `SELECT r.wallet_address, r.chat_id, b.brand_address, b.seeded
     FROM registrations r
     JOIN registration_brands b ON b.wallet_address = r.wallet_address`
  );
  return rows.map((r) => ({
    walletAddress: r.wallet_address,
    chatId: r.chat_id,
    brandAddress: r.brand_address,
    seeded: r.seeded,
  }));
}

export async function markBrandSeeded(walletAddress: string, brandAddress: string): Promise<void> {
  await pool.query(
    `UPDATE registration_brands SET seeded = TRUE
     WHERE wallet_address = $1 AND brand_address = $2`,
    [walletAddress, brandAddress]
  );
}

export async function isProposalNotified(
  brandAddress: string,
  proposerAddress: string
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM proposal_snapshots
     WHERE brand_address = $1 AND proposer_address = $2 AND notified_incoming = TRUE`,
    [brandAddress, proposerAddress]
  );
  return rows.length > 0;
}

export async function upsertProposalSnapshot(
  brandAddress: string,
  proposerAddress: string,
  rate: number,
  notifiedIncoming: boolean
): Promise<void> {
  await pool.query(
    `INSERT INTO proposal_snapshots (brand_address, proposer_address, rate, notified_incoming, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (brand_address, proposer_address)
     DO UPDATE SET rate = EXCLUDED.rate,
                   notified_incoming = EXCLUDED.notified_incoming,
                   updated_at = NOW()`,
    [brandAddress, proposerAddress, rate, notifiedIncoming]
  );
}

export async function isActivePairNotified(
  fromBrand: string,
  toBrand: string
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM active_pair_snapshots WHERE from_brand = $1 AND to_brand = $2`,
    [fromBrand, toBrand]
  );
  return rows.length > 0;
}

export async function markActivePairNotified(
  fromBrand: string,
  toBrand: string
): Promise<void> {
  await pool.query(
    `INSERT INTO active_pair_snapshots (from_brand, to_brand, notified_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (from_brand, to_brand) DO NOTHING`,
    [fromBrand, toBrand]
  );
}
