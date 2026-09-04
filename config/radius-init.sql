-- FreeRADIUS PostgreSQL Schema
-- TCU-PLATFORM-V10 — PC2 Ubuntu Server
-- Sumber: FreeRADIUS 3.x official schema dengan ekstensi TCU

-- ─── radcheck: credential dan check items per user ──────────────────────────
CREATE TABLE IF NOT EXISTS radcheck (
  id         BIGSERIAL PRIMARY KEY,
  username   VARCHAR(64) NOT NULL DEFAULT '',
  attribute  VARCHAR(64) NOT NULL DEFAULT '',
  op         CHAR(2)     NOT NULL DEFAULT '==',
  value      VARCHAR(253) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS radcheck_username ON radcheck (username, attribute);

-- ─── radreply: reply attributes per user ────────────────────────────────────
CREATE TABLE IF NOT EXISTS radreply (
  id        BIGSERIAL PRIMARY KEY,
  username  VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op        CHAR(2)     NOT NULL DEFAULT '=',
  value     VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radreply_username ON radreply (username, attribute);

-- ─── radgroupcheck: check items per group ───────────────────────────────────
CREATE TABLE IF NOT EXISTS radgroupcheck (
  id        BIGSERIAL PRIMARY KEY,
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op        CHAR(2)     NOT NULL DEFAULT '==',
  value     VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radgroupcheck_groupname ON radgroupcheck (groupname, attribute);

-- ─── radgroupreply: reply attributes per group ───────────────────────────────
CREATE TABLE IF NOT EXISTS radgroupreply (
  id        BIGSERIAL PRIMARY KEY,
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op        CHAR(2)     NOT NULL DEFAULT '=',
  value     VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radgroupreply_groupname ON radgroupreply (groupname, attribute);

-- ─── radusergroup: mapping user → group ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS radusergroup (
  id        BIGSERIAL PRIMARY KEY,
  username  VARCHAR(64) NOT NULL DEFAULT '',
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  priority  INT         NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS radusergroup_username ON radusergroup (username);

-- ─── radacct: accounting sessions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radacct (
  radacctid          BIGSERIAL PRIMARY KEY,
  acctsessionid      VARCHAR(64)  NOT NULL DEFAULT '',
  acctuniqueid       VARCHAR(32)  NOT NULL DEFAULT '' UNIQUE,
  username           VARCHAR(64)  NOT NULL DEFAULT '',
  realm              VARCHAR(64)  DEFAULT '',
  nasipaddress       INET         NOT NULL,
  nasportid          VARCHAR(15)  DEFAULT NULL,
  nasporttype        VARCHAR(32)  DEFAULT NULL,
  acctstarttime      TIMESTAMPTZ  DEFAULT NULL,
  acctupdatetime     TIMESTAMPTZ  DEFAULT NULL,
  acctstoptime       TIMESTAMPTZ  DEFAULT NULL,
  acctinterval       BIGINT       DEFAULT NULL,
  acctsessiontime    BIGINT       DEFAULT NULL,
  acctauthentic      VARCHAR(32)  DEFAULT NULL,
  connectinfo_start  VARCHAR(50)  DEFAULT NULL,
  connectinfo_stop   VARCHAR(50)  DEFAULT NULL,
  acctinputoctets    BIGINT       DEFAULT NULL,
  acctoutputoctets   BIGINT       DEFAULT NULL,
  calledstationid    VARCHAR(50)  NOT NULL DEFAULT '',
  callingstationid   VARCHAR(50)  NOT NULL DEFAULT '',
  acctterminatecause VARCHAR(32)  NOT NULL DEFAULT '',
  servicetype        VARCHAR(32)  DEFAULT NULL,
  framedprotocol     VARCHAR(32)  DEFAULT NULL,
  framedipaddress    INET         DEFAULT NULL,
  framedipv6address  INET         DEFAULT NULL,
  framedipv6prefix   INET         DEFAULT NULL,
  framedinterfaceid  VARCHAR(44)  DEFAULT NULL,
  delegatedipv6prefix INET        DEFAULT NULL,
  class              VARCHAR(64)  DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS radacct_username       ON radacct (username);
CREATE INDEX IF NOT EXISTS radacct_nasipaddress   ON radacct (nasipaddress);
CREATE INDEX IF NOT EXISTS radacct_acctstarttime  ON radacct (acctstarttime);
CREATE INDEX IF NOT EXISTS radacct_acctstoptime   ON radacct (acctstoptime);
CREATE INDEX IF NOT EXISTS radacct_framedipaddress ON radacct (framedipaddress);

-- ─── radpostauth: authentication log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radpostauth (
  id         BIGSERIAL PRIMARY KEY,
  username   VARCHAR(64) NOT NULL DEFAULT '',
  pass       VARCHAR(64) NOT NULL DEFAULT '',
  reply      VARCHAR(32) NOT NULL DEFAULT '',
  authdate   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  class      VARCHAR(64) DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS radpostauth_username ON radpostauth (username);
CREATE INDEX IF NOT EXISTS radpostauth_authdate ON radpostauth (authdate);

-- ─── nas: NAS device registry ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nas (
  id          BIGSERIAL PRIMARY KEY,
  nasname     VARCHAR(128) NOT NULL,
  shortname   VARCHAR(32),
  type        VARCHAR(30)  DEFAULT 'other',
  ports       INT,
  secret      VARCHAR(60)  NOT NULL DEFAULT 'secret',
  server      VARCHAR(64),
  community   VARCHAR(50),
  description VARCHAR(200) DEFAULT 'RADIUS Client'
);

-- ─── Fungsi otomatis update updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_radcheck_updated_at
  BEFORE UPDATE ON radcheck
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── system_settings: konfigurasi dinamis payment & notifikasi ────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
