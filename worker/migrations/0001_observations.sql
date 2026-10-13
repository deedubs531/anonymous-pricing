-- One row per shared price check. No names, accounts, addresses or IP addresses.
CREATE TABLE observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,            -- when the server received it (ms since epoch)
  kind TEXT NOT NULL,             -- 'web' or 'app'
  source TEXT NOT NULL,           -- extension, userscript, bookmarklet, app-check
  install TEXT NOT NULL,          -- random per-browser ID (counts contributors, limits spam)
  site TEXT,                      -- web: store host, e.g. homedepot.com
  path TEXT,                      -- web: page path without query string
  name TEXT,                      -- web: product name the store publishes
  app TEXT,                       -- app: uber, lyft, instacart, doordash, ubereats
  option TEXT,                    -- app: e.g. UberX, Item subtotal
  currency TEXT,
  mine REAL NOT NULL,             -- the contributor's price
  baseline REAL NOT NULL,         -- signed-out or clean-account price
  baseline2 REAL,                 -- web: second signed-out check
  baseline_type TEXT NOT NULL,
  verdict TEXT NOT NULL,          -- higher, lower, same, unstable
  pct REAL NOT NULL,              -- (mine - baseline) / baseline, in percent
  gap_seconds INTEGER,            -- app: time between the two screenshots
  country TEXT,                   -- from Cloudflare, e.g. US
  region TEXT                     -- US state code from Cloudflare, e.g. NY
);
CREATE INDEX observations_ts ON observations (ts);
CREATE INDEX observations_install_ts ON observations (install, ts);
