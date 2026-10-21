-- Read-only verification. Policies and grants must be present before using data.
select n.nspname as schema_name,c.relname,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where (n.nspname,c.relname) in (('public','planner_documents'),('life_private','owners'));
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where tablename in ('planner_documents','owners');
select table_schema,table_name,grantee,privilege_type
from information_schema.role_table_grants
where table_name in ('planner_documents','owners') and grantee in ('anon','authenticated','PUBLIC');
