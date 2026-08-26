-- ============================================================
-- ZETSU PACKZ — 2-table schema
--   cards              — static identity per card: what it is,
--                         which deck, its base value, where it
--                         started. Doesn't change quarter to quarter.
--   popularity_ledger   — the actual tracking table. One row per
--                         card, holding that card's live buys/sales
--                         race, its current tier, and the threshold
--                         it's racing toward. This is what changes
--                         every quarter.
-- ============================================================

create type card_tier as enum ('common', 'rare', 'epic', 'legendary', 'mythic');

-- ------------------------------------------------------------
-- CARDS — static identity, doesn't move
-- ------------------------------------------------------------
create table cards (
  id            text primary key,        -- e.g. "common-iron-warden"
  deck          text not null,           -- e.g. "Season 0" — plain text, not a foreign key
  card          text not null,
  image         text not null,
  value         numeric not null default 5,
  origin_tier   card_tier not null default 'common',
  is_preset     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- POPULARITY_LEDGER — one row per card, tracks that card's live
-- race toward promotion/demotion. This is the table that actually
-- changes: buys/sales tick up as people trade the card, current_tier
-- and threshold update when a quarterly review moves it.
-- ------------------------------------------------------------
create table popularity_ledger (
  card          text primary key references cards(id) on delete cascade,
  deck          text not null,           -- e.g. "Season 0"
  current_tier  card_tier not null default 'common',
  threshold     integer not null,        -- buys OR sales hitting this first decides the move
  buys          integer not null default 0,
  sales         integer not null default 0,
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- SEED DATA — matches deck-demo.json (Season 0, 1 card)
-- ============================================================

insert into cards (id, deck, card, image, value, origin_tier, is_preset)
values (
  'epic-mikimbri',
  'Season 0',
  'Mikimbri',
  'https://aefd92791e.cbaul-cdnwnd.com/d10539437c0c9009ebf0318f1bb1b6c7/200000138-ad332ad334/700/Screenshot_20231221_081855.webp?ph=aefd92791e',
  5,
  'epic',
  true
);

insert into popularity_ledger (card, deck, current_tier, threshold, buys, sales)
values (
  'epic-mikimbri',
  'Season 0',
  'epic',
  216000,
  0,
  0
);
