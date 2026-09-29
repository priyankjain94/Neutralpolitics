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
