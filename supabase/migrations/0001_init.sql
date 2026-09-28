-- Neutral Politics user data.
-- Articles stay in the git repo. Run this in the Supabase SQL editor.
-- The service role used by the site bypasses row level security.
-- Anonymous and logged-in keys cannot read or write these tables.

create extension if not exists pgcrypto;

do $$ begin
  create type submission_status as enum ('new', 'verifying', 'approved', 'rejected', 'posted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'not_applicable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signup_language as enum ('en', 'hi', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signup_channel as enum ('email', 'whatsapp', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_type as enum ('correction', 'factcheck', 'contact');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('new', 'reviewing', 'done', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null,
  city text not null,
  state text not null,
  description text not null,
  event_date timestamptz,
  event_location text,
  language text not null default 'en',
  extra_notes text,
  social_handle text,
  credit_preference text,
  video_key text,
  video_provider text,
  video_size_bytes bigint,
  video_mime text,
  video_duration_s integer,
  upload_completed_at timestamptz,
  consent_version text not null,
  consent_at timestamptz not null,
  age_confirmed_at timestamptz not null,
  consent_ip_hash text,
  status submission_status not null default 'new',
  status_changed_at timestamptz not null default now(),
  reviewer text,
  notes text,
  rejection_reason text,
  posted_ig_url text,
  posted_article_slug text,
  checklist jsonb not null default '{}'::jsonb,
  payment_status payment_status,
  payment_amount_inr integer,
  deleted_at timestamptz
);

comment on column submissions.payment_status is 'Unused in v1. Nullable on purpose.';
comment on column submissions.payment_amount_inr is 'Unused in v1.';

create table if not exists submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  from_status submission_status,
  to_status submission_status,
  note text
);

create table if not exists signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text,
  whatsapp_e164 text,
  language signup_language not null,
  topics text[] not null default '{}',
  channel signup_channel not null,
  confirmed_at timestamptz,
  consent_text_version text not null,
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source_page text,
  constraint signups_contact_chk check (email is not null or whatsapp_e164 is not null)
);

create unique index if not exists signups_email_active on signups (lower(email)) where email is not null and unsubscribed_at is null;
create unique index if not exists signups_whatsapp_active on signups (whatsapp_e164) where whatsapp_e164 is not null and unsubscribed_at is null;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type report_type not null,
  article_url text,
  message text not null,
  email text,
  name text,
  status report_status not null default 'new',
  notes text,
  consent_ip_hash text
);

create index if not exists submissions_status_idx on submissions (status, created_at desc);
create index if not exists reports_status_idx on reports (status, created_at desc);

alter table submissions enable row level security;
alter table submission_events enable row level security;
alter table signups enable row level security;
alter table reports enable row level security;

revoke all on submissions from anon, authenticated;
revoke all on submission_events from anon, authenticated;
revoke all on signups from anon, authenticated;
revoke all on reports from anon, authenticated;
