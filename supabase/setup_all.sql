-- Neutral Politics: paste this whole file once in the Supabase SQL editor.
-- Idempotent. Order is 0001, 0002, 0003, then the private submissions bucket.
-- The service role bypasses row level security. anon and authenticated cannot read or write.

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

-- Desk extensions. Run after 0001_init.sql.
-- Story text stays in git. Edits, publish flags, corrections, payments and the audit log live here.
-- The service role bypasses row level security. anon and authenticated cannot read or write.

alter table submissions add column if not exists desk_status text not null default 'new';
alter table submissions add column if not exists category text;
alter table submissions add column if not exists payment_track text not null default 'unpaid';
alter table submissions add column if not exists payment_method text;
alter table submissions add column if not exists payment_reference text;
alter table submissions add column if not exists payment_at timestamptz;

alter table submissions drop constraint if exists submissions_desk_status_chk;
alter table submissions add constraint submissions_desk_status_chk
  check (desk_status in ('new', 'under_review', 'verified', 'rejected', 'published'));

alter table submissions drop constraint if exists submissions_payment_track_chk;
alter table submissions add constraint submissions_payment_track_chk
  check (payment_track in ('unpaid', 'pending', 'paid'));

update submissions set desk_status = case status::text
  when 'verifying' then 'under_review'
  when 'approved' then 'verified'
  when 'posted' then 'published'
  when 'rejected' then 'rejected'
  else 'new'
end
where desk_status = 'new' and status::text <> 'new';

alter table submission_events alter column from_status type text using from_status::text;
alter table submission_events alter column to_status type text using to_status::text;

create table if not exists story_overrides (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  year text not null,
  month text not null,
  lang text not null check (lang in ('en', 'hi')),
  status text check (status in ('published', 'draft')),
  sensitive boolean not null default false,
  title text,
  standfirst text,
  body text,
  category text,
  sources jsonb,
  updated_at timestamptz not null default now(),
  unique (slug, lang)
);

create table if not exists desk_corrections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lang text not null check (lang in ('en', 'hi', 'both')),
  note text not null,
  article_slug text,
  article_year text,
  article_month text,
  visible boolean not null default true
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target text,
  detail text
);

create index if not exists story_overrides_slug_idx on story_overrides (slug);
create index if not exists audit_log_at_idx on audit_log (at desc);
create index if not exists desk_corrections_visible_idx on desk_corrections (visible, created_at desc);

alter table story_overrides enable row level security;
alter table desk_corrections enable row level security;
alter table audit_log enable row level security;

revoke all on story_overrides from anon, authenticated;
revoke all on desk_corrections from anon, authenticated;
revoke all on audit_log from anon, authenticated;

comment on table story_overrides is 'Overrides git articles. Null fields keep the file value. status published or draft replaces the file status.';
comment on column submissions.payment_track is 'Tracking only. The site does not send money.';

-- Reader error reports. Run after 0002_admin_desk.sql.
-- The service role bypasses row level security. anon and authenticated cannot read or write.

create table if not exists error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  story_ref text not null,
  what_wrong text not null,
  suggested_correction text not null,
  source_url text,
  name text,
  email text,
  language text not null check (language in ('en', 'hi')),
  consent_contact boolean not null default false,
  consent_at timestamptz not null default now(),
  consent_ip_hash text,
  status text not null default 'new',
  notes text,
  desk_correction_id uuid references desk_corrections(id),
  reviewed_at timestamptz
);

alter table error_reports drop constraint if exists error_reports_status_chk;
alter table error_reports add constraint error_reports_status_chk
  check (status in ('new', 'reviewing', 'fixed', 'rejected'));

create index if not exists error_reports_status_idx on error_reports (status, created_at desc);

alter table error_reports enable row level security;
revoke all on error_reports from anon, authenticated;

comment on table error_reports is 'Public report-an-error form. Writes use the service role. consent_ip_hash is a salted hash, not the raw IP.';

-- Private video bucket. 200 MB. Video types only. No public read.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'submissions',
    'submissions',
    false,
    209715200,
    array['video/mp4', 'video/quicktime', 'video/3gpp', 'video/webm']
  )
  on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
exception
  when undefined_table or undefined_column then
    raise notice 'storage.buckets was not updated. Create a private bucket named submissions in the Storage screen.';
end $$;
