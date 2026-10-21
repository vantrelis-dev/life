-- Dedicated-project acceptance test. Refuses to run over an existing agenda.
-- Run as the project database admin after authorizing exactly one owner.
-- No auth users are created. Every test write is rolled back.
begin;
do $$ begin
  if (select count(*) from life_private.owners) <> 1 then
    raise exception 'Expected exactly one authorized owner';
  end if;
  if exists(select 1 from public.planner_documents) then
    raise exception 'Agenda already exists: do not run this initial acceptance test';
  end if;
end $$;
select set_config('life.qa.owner',(select user_id::text from life_private.owners limit 1),true);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('life.qa.owner'),'role','authenticated')::text,true);
do $$ declare changed integer; begin
  insert into public.planner_documents(user_id,revision,body)
  values(auth.uid(),1,'{"version":2,"companies":{},"tasks":[],"projects":[],"goals":[],"habits":[],"habitChecks":{},"dayNotes":{}}'::jsonb);
  if (select count(*) from public.planner_documents) <> 1 then raise exception 'Owner read failed'; end if;
  update public.planner_documents set revision=2 where user_id=auth.uid() and revision=1;
  get diagnostics changed=row_count;
  if changed <> 1 then raise exception 'Owner update failed'; end if;
  update public.planner_documents set revision=3 where user_id=auth.uid() and revision=1;
  get diagnostics changed=row_count;
  if changed <> 0 then raise exception 'Stale revision overwrote current data'; end if;
  begin
    update public.planner_documents set user_id='11111111-1111-4111-8111-111111111111' where user_id=auth.uid();
    raise exception 'Owner reassignment unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform body from public.planner_documents;
    raise exception 'Anonymous read unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare changed integer; begin
  if exists(select 1 from public.planner_documents) then raise exception 'Foreign read unexpectedly allowed'; end if;
  if exists(select 1 from life_private.owners) then raise exception 'Foreign membership read unexpectedly allowed'; end if;
  update public.planner_documents set revision=99;
  get diagnostics changed=row_count;
  if changed <> 0 then raise exception 'Foreign update unexpectedly allowed'; end if;
  begin
    insert into public.planner_documents(user_id,revision,body)
    values(current_setting('life.qa.owner')::uuid,1,'{"version":2,"companies":{},"tasks":[],"projects":[],"goals":[],"habits":[],"habitChecks":{},"dayNotes":{}}'::jsonb);
    raise exception 'Foreign insert unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
select 'PASS: owner create/read/update; stale revision; reassignment; anonymous and foreign access; all test writes rolled back' as result;
