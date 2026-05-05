import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../notify.json');

interface DbData {
  registrations: Record<string, { walletAddress: string; chatId: string; brandAddresses: string[] }>;
  proposalSnapshots: Record<string, Record<string, { rate: number; notifiedIncoming: boolean }>>;
  activePairSnapshots: Record<string, Record<string, boolean>>;
}

function read(): DbData {
  if (!fs.existsSync(DB_PATH)) {
    return { registrations: {}, proposalSnapshots: {}, activePairSnapshots: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DbData;
}

function write(data: DbData): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export interface Registration {
  walletAddress: string;
  chatId: string;
  brandAddresses: string[];
}

export function upsertRegistration(reg: Registration): void {
  const db = read();
  db.registrations[reg.walletAddress] = reg;
  write(db);
}

export function getAllRegistrations(): Registration[] {
  return Object.values(read().registrations);
}

export function isProposalNotified(brandAddress: string, proposerAddress: string): boolean {
  const db = read();
  return db.proposalSnapshots[brandAddress]?.[proposerAddress]?.notifiedIncoming === true;
}

export function upsertProposalSnapshot(brandAddress: string, proposerAddress: string, rate: number, notifiedIncoming: boolean): void {
  const db = read();
  if (!db.proposalSnapshots[brandAddress]) db.proposalSnapshots[brandAddress] = {};
  db.proposalSnapshots[brandAddress][proposerAddress] = { rate, notifiedIncoming };
  write(db);
}

export function isActivePairNotified(fromBrand: string, toBrand: string): boolean {
  const db = read();
  return db.activePairSnapshots[fromBrand]?.[toBrand] === true;
}

export function markActivePairNotified(fromBrand: string, toBrand: string): void {
  const db = read();
  if (!db.activePairSnapshots[fromBrand]) db.activePairSnapshots[fromBrand] = {};
  db.activePairSnapshots[fromBrand][toBrand] = true;
  write(db);
}
