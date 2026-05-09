CREATE TABLE IF NOT EXISTS registrations (
  wallet_address TEXT PRIMARY KEY,
  chat_id        TEXT NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_brands (
  wallet_address TEXT NOT NULL REFERENCES registrations(wallet_address) ON DELETE CASCADE,
  brand_address  TEXT NOT NULL,
  PRIMARY KEY (wallet_address, brand_address)
);

CREATE TABLE IF NOT EXISTS proposal_snapshots (
  brand_address     TEXT    NOT NULL,
  proposer_address  TEXT    NOT NULL,
  rate              BIGINT  NOT NULL,
  notified_incoming BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (brand_address, proposer_address)
);

CREATE TABLE IF NOT EXISTS active_pair_snapshots (
  from_brand  TEXT NOT NULL,
  to_brand    TEXT NOT NULL,
  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (from_brand, to_brand)
);

CREATE INDEX IF NOT EXISTS idx_registrations_chat_id ON registrations(chat_id);
CREATE INDEX IF NOT EXISTS idx_registration_brands_brand ON registration_brands(brand_address);
