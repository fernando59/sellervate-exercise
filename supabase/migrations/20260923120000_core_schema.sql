-- Core schema for Sellervate QA: brands (the tenant), people and their per-brand
-- roles, the replies being reviewed, and the reviews themselves.
--
-- Every table enables row level security here, in the same migration that creates
-- it. No policies exist yet, so the API roles (anon, authenticated) see nothing
-- until the authorization migration adds them. The seed runs as the postgres
-- superuser and is not affected.
--
-- Catalog-like values (role, severity) are text + check, not Postgres enums, so
-- adding a value is a one-line constraint change instead of an enum migration.

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null check (length(trim(full_name)) > 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Brands (the tenant) and per-brand roles
-- ---------------------------------------------------------------------------

create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name       text not null,
  -- The one rule a reviewer should hold the reply against, shown above every reply.
  key_rule   text not null,
  -- Longer brand procedures, shown on the reply detail page.
  guidelines text not null default '',
  created_at timestamptz not null default now()
);

alter table public.brands enable row level security;

-- The role lives on the membership, not on the profile: the same person can lead
-- one brand and have no access at all to another.
create table public.brand_memberships (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  brand_id   uuid not null references public.brands (id) on delete cascade,
  role       text not null check (role in ('lead', 'specialist')),
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);

-- The primary key covers lookups by user_id; RLS and "who works on this brand"
-- look up by brand_id.
create index brand_memberships_brand_id_idx on public.brand_memberships (brand_id);

alter table public.brand_memberships enable row level security;

-- ---------------------------------------------------------------------------
-- Replies: support answers already sent from the brand's helpdesk
-- ---------------------------------------------------------------------------

create table public.replies (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid not null references public.brands (id),
  specialist_id    uuid not null references public.profiles (id),
  -- Where the reply came from ('seed' today; 'zendesk', 'gorgias'... once a
  -- helpdesk importer exists). Together with external_id it makes imports
  -- idempotent: the importer upserts on (source, external_id).
  source           text not null check (length(source) > 0),
  external_id      text not null check (length(external_id) > 0),
  ticket_ref       text not null,
  subject          text not null,
  customer_message text not null,
  reply_body       text not null,
  received_at      timestamptz not null,
  sent_at          timestamptz not null,
  created_at       timestamptz not null default now(),
  constraint replies_sent_after_received check (sent_at >= received_at),
  constraint replies_source_external_id_key unique (source, external_id),
  -- Target of the composite foreign key from reviews, so a review cannot claim a
  -- different brand than the reply it reviews.
  constraint replies_id_brand_id_key unique (id, brand_id)
);

-- The review queue and the weekly trend both read "this brand, this date range".
create index replies_brand_id_sent_at_idx on public.replies (brand_id, sent_at);
create index replies_specialist_id_idx on public.replies (specialist_id);

alter table public.replies enable row level security;

-- ---------------------------------------------------------------------------
-- Issue catalog: what went wrong, with a fixed severity
-- ---------------------------------------------------------------------------

-- Severity measures harm to the brand relationship, not writing quality. It
-- lives on the catalog so every lead grades the same issue the same way. It
-- never computes the score; it only sorts, flags and reports.
create table public.issue_types (
  code       text primary key check (code ~ '^[a-z_]+$'),
  label      text not null,
  severity   text not null check (severity in ('minor', 'major', 'critical')),
  sort_order smallint not null default 0,
  -- Retire an issue by setting active = false; deleting it would break old reviews.
  active     boolean not null default true
);

alter table public.issue_types enable row level security;

-- The catalog is reference data, not seed data: the app does not work without it.
insert into public.issue_types (code, label, severity, sort_order) values
  ('wrong_info',        'Wrong information about the product or policy',        'critical', 10),
  ('no_order_check',    'Did not check the order history',                      'critical', 20),
  ('skipped_procedure', 'Skipped a mandatory brand procedure',                  'critical', 30),
  ('wrong_question',    'Answered a different question',                       'major',    40),
  ('incomplete',        'Correct but incomplete: the customer will write back', 'major',    50),
  ('tone',              'Wrong tone for the brand',                             'minor',    60),
  ('length',            'Wrong length for the brand',                           'minor',    70),
  ('slow',              'Slow response',                                        'minor',    80);

-- ---------------------------------------------------------------------------
-- Reviews: a lead's judgement on one sent reply
-- ---------------------------------------------------------------------------

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  reply_id    uuid not null,
  -- Denormalized from the reply so RLS can check the brand without a join. The
  -- composite foreign key below keeps it honest.
  brand_id    uuid not null,
  reviewer_id uuid not null references public.profiles (id),
  score       smallint not null check (score between 1 and 5),
  comment     text not null default '',
  -- Marks a reply worth showing to new specialists. The coaching library is V2.
  is_exemplar boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint reviews_reply_brand_fkey foreign key (reply_id, brand_id)
    references public.replies (id, brand_id) on delete cascade,
  -- One review per reply and reviewer; saving again edits it.
  constraint reviews_reply_id_reviewer_id_key unique (reply_id, reviewer_id)
);

-- reply_id lookups use the unique index above (reply_id is its first column).
create index reviews_brand_id_idx on public.reviews (brand_id);
create index reviews_reviewer_id_idx on public.reviews (reviewer_id);

alter table public.reviews enable row level security;

create table public.review_issues (
  review_id  uuid not null references public.reviews (id) on delete cascade,
  issue_code text not null references public.issue_types (code),
  primary key (review_id, issue_code)
);

-- "Which issue keeps coming back" groups by issue_code.
create index review_issues_issue_code_idx on public.review_issues (issue_code);

alter table public.review_issues enable row level security;

-- ---------------------------------------------------------------------------
-- Brand events: "what we changed", drawn on the trend chart
-- ---------------------------------------------------------------------------

create table public.brand_events (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references public.brands (id) on delete cascade,
  happened_on date not null,
  note        text not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index brand_events_brand_id_happened_on_idx on public.brand_events (brand_id, happened_on);
create index brand_events_created_by_idx on public.brand_events (created_by);

alter table public.brand_events enable row level security;
