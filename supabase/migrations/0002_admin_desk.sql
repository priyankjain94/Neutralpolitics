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
