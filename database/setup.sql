-- Initial setup for a NEW dedicated Life project. Run as its database admin.
-- No owner is granted automatically. Authorize the verified owner separately.
begin;
create schema if not exists life_private;
revoke all on schema life_private from public, anon, authenticated;
grant usage on schema life_private to authenticated;

create table life_private.owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table life_private.owners enable row level security;
alter table life_private.owners force row level security;
revoke all on life_private.owners from public, anon, authenticated;
grant select on life_private.owners to authenticated;
create policy owner_membership_read on life_private.owners for select
  to authenticated using (user_id=(select auth.uid()));

create table public.planner_documents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null check (revision>=1),
  body jsonb not null,
  updated_at timestamptz not null default now(),
  constraint planner_document_shape check (
    octet_length(body::text)<=4000000
    and body ?& array['version','companies','tasks','projects','goals','habits','habitChecks','dayNotes']
    and body->>'version'='2'
    and jsonb_typeof(body->'companies')='object'
    and jsonb_typeof(body->'tasks')='array'
    and jsonb_array_length(body->'tasks')<=20000
    and jsonb_typeof(body->'projects')='array'
    and jsonb_typeof(body->'goals')='array'
    and jsonb_array_length(body->'goals')<1000
    and jsonb_typeof(body->'habits')='array'
    and jsonb_typeof(body->'habitChecks')='object'
    and jsonb_typeof(body->'dayNotes')='object'
  )
);
alter table public.planner_documents enable row level security;
alter table public.planner_documents force row level security;
revoke all on public.planner_documents from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select,insert,update on public.planner_documents to authenticated;

create policy planner_read on public.planner_documents for select to authenticated
using (user_id=(select auth.uid()) and (select exists(select 1 from life_private.owners where user_id=(select auth.uid()))));
create policy planner_insert on public.planner_documents for insert to authenticated
with check (user_id=(select auth.uid()) and (select exists(select 1 from life_private.owners where user_id=(select auth.uid()))));
create policy planner_update on public.planner_documents for update to authenticated
using (user_id=(select auth.uid()) and (select exists(select 1 from life_private.owners where user_id=(select auth.uid()))))
with check (user_id=(select auth.uid()) and (select exists(select 1 from life_private.owners where user_id=(select auth.uid()))));
commit;
