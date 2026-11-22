-- ============================================================================
-- 02_rls.sql - Row Level Security for the Online Examination System
-- Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
-- ----------------------------------------------------------------------------
-- MILESTONE M1 - fully implemented. Run AFTER 01_schema.sql.
--
-- This file is the security mark of the project. The browser only ever holds the
-- public anon key, so RLS - not the JavaScript - is what decides which rows a
-- user may read or write. Three roles, three different rules:
--
--   student : open exams + their own attempt. Never options.is_correct.
--   doctor  : only the exams (and children) they created (created_by = auth.uid())
--   admin   : profiles + subjects, and read access for reporting
--
-- The file is idempotent: helper functions are "create or replace", policies are
-- dropped before being created, and RLS enablement is a no-op when already on.
-- ============================================================================

-- ============================================================================
-- STEP 1 - helper functions
-- ============================================================================
-- A policy on `profiles` that queries `profiles` recurses and fails at runtime
-- ("infinite recursion detected in policy"). Every rule about the caller's role
-- therefore goes through one of these security definer functions, which read the
-- profiles table with the owner's rights and return a single value.

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

-- Does the caller (a doctor) own this exam?
create or replace function public.owns_exam(p_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.exams e
     where e.id = p_exam_id and e.created_by = auth.uid()
  );
$$;

-- Does the caller own the exam the question belongs to? Used by the options
-- policies, where only the question id is available.
create or replace function public.owns_question(p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.questions q
      join public.exams e on e.id = q.exam_id
     where q.id = p_question_id and e.created_by = auth.uid()
  );
$$;

-- Only signed-in users may call them; an anonymous caller has no role anyway.
revoke all on function public.current_role() from public;
revoke all on function public.current_is_active() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.owns_exam(uuid) from public;
revoke all on function public.owns_question(uuid) from public;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_is_active() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_exam(uuid) to authenticated;
grant execute on function public.owns_question(uuid) to authenticated;

-- ============================================================================
-- STEP 2 - enable RLS on every table
-- ============================================================================
-- Without this line the policies below are ignored completely. That is the single
-- most common mistake in a Supabase project, and the first thing to check when a
-- policy "does not work".
alter table public.profiles      enable row level security;
alter table public.subjects      enable row level security;
alter table public.exams         enable row level security;
alter table public.questions     enable row level security;
alter table public.options       enable row level security;
alter table public.attempts      enable row level security;
alter table public.answers       enable row level security;
alter table public.security_logs enable row level security;

-- Table privileges: RLS filters rows, a GRANT decides whether the role may touch
-- the table at all. Supabase sets these by default, but stating them makes this
-- file work on a plain PostgreSQL instance too - and makes it obvious that the
-- restriction comes from the policies, never from a missing privilege.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.subjects,
  public.exams,
  public.questions,
  public.options,
  public.attempts,
  public.answers,
  public.security_logs
to authenticated;

-- Anonymous visitors may only write to the audit log (and the INSERT policy
-- narrows that to LOGIN_FAILED). Nothing else is granted to anon on purpose:
-- signed-out users read no table at all.
grant insert on public.security_logs to anon;

-- ============================================================================
-- STEP 3 - profiles
-- ============================================================================
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin());

-- A doctor needs the name of the students who sat his exams (the results table).
-- Only the student rows, never another doctor's profile and never an admin's.
drop policy if exists profiles_select_doctor_students on public.profiles;
create policy profiles_select_doctor_students on public.profiles
  for select to authenticated
  using (public.current_role() = 'doctor' and role = 'student');

-- A user may edit their own row, but the WITH CHECK pins role and is_active to
-- their current values: without it anybody could promote themselves to admin.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.current_role()
    and is_active = public.current_is_active()
  );

-- The admin may change any row, including role and is_active.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No INSERT policy: the signup trigger creates the row (security definer).
-- No DELETE policy: accounts are closed with is_active, so exam history survives.

-- ============================================================================
-- STEP 4 - subjects
-- ============================================================================
-- Everybody signed in needs subject names (the exam cards show them).
drop policy if exists subjects_select_all on public.subjects;
create policy subjects_select_all on public.subjects
  for select to authenticated
  using (true);

drop policy if exists subjects_insert_admin on public.subjects;
create policy subjects_insert_admin on public.subjects
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists subjects_update_admin on public.subjects;
create policy subjects_update_admin on public.subjects
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists subjects_delete_admin on public.subjects;
create policy subjects_delete_admin on public.subjects
  for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- STEP 5 - exams
-- ============================================================================
-- Student view: published exams inside their time window.
drop policy if exists exams_select_open on public.exams;
create policy exams_select_open on public.exams
  for select to authenticated
  using (
    is_active
    and (start_time is null or start_time <= now())
    and (end_time is null or end_time >= now())
  );

-- Doctor view: everything he created, published or not (drafts included).
drop policy if exists exams_select_owner on public.exams;
create policy exams_select_owner on public.exams
  for select to authenticated
  using (created_by = auth.uid());

drop policy if exists exams_select_admin on public.exams;
create policy exams_select_admin on public.exams
  for select to authenticated
  using (public.is_admin());

-- Only a doctor may create an exam, and only in his own name.
drop policy if exists exams_insert_doctor on public.exams;
create policy exams_insert_doctor on public.exams
  for insert to authenticated
  with check (created_by = auth.uid() and public.current_role() = 'doctor');

drop policy if exists exams_update_owner on public.exams;
create policy exams_update_owner on public.exams
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Delete is allowed only while the exam has no attempts: once a student sat it,
-- the rows are evidence and the exam is unpublished (is_active = false) instead.
drop policy if exists exams_delete_owner on public.exams;
create policy exams_delete_owner on public.exams
  for delete to authenticated
  using (created_by = auth.uid() and not exists (
    select 1 from public.attempts a where a.exam_id = exams.id
  ));

-- ============================================================================
-- STEP 6 - questions
-- ============================================================================
-- "Visible if its exam is visible to me": the subquery is evaluated with the
-- caller's rights, so the exams policies above do the real filtering. An open
-- exam shows its questions, a draft shows them only to its owner, and an exam
-- from another doctor is invisible.
drop policy if exists questions_select_visible on public.questions;
create policy questions_select_visible on public.questions
  for select to authenticated
  using (exists (select 1 from public.exams e where e.id = questions.exam_id));

drop policy if exists questions_insert_owner on public.questions;
create policy questions_insert_owner on public.questions
  for insert to authenticated
  with check (public.owns_exam(exam_id));

drop policy if exists questions_update_owner on public.questions;
create policy questions_update_owner on public.questions
  for update to authenticated
  using (public.owns_exam(exam_id))
  with check (public.owns_exam(exam_id));

drop policy if exists questions_delete_owner on public.questions;
create policy questions_delete_owner on public.questions
  for delete to authenticated
  using (public.owns_exam(exam_id));

-- ============================================================================
-- STEP 7 - options (the answer key)
-- ============================================================================
-- There is deliberately NO select policy for students on this table: a student
-- gets zero rows, so `select('is_correct')` returns an empty array instead of the
-- key. Grading happens in submit_attempt(); students read the option texts from
-- the view created at the end of this file.
drop policy if exists options_select_owner_admin on public.options;
create policy options_select_owner_admin on public.options
  for select to authenticated
  using (public.owns_question(question_id) or public.is_admin());

drop policy if exists options_insert_owner on public.options;
create policy options_insert_owner on public.options
  for insert to authenticated
  with check (public.owns_question(question_id));

drop policy if exists options_update_owner on public.options;
create policy options_update_owner on public.options
  for update to authenticated
  using (public.owns_question(question_id))
  with check (public.owns_question(question_id));

drop policy if exists options_delete_owner on public.options;
create policy options_delete_owner on public.options
  for delete to authenticated
  using (public.owns_question(question_id));

-- ============================================================================
-- STEP 8 - attempts
-- ============================================================================
drop policy if exists attempts_select_own on public.attempts;
create policy attempts_select_own on public.attempts
  for select to authenticated
  using (student_id = auth.uid());

drop policy if exists attempts_select_doctor on public.attempts;
create policy attempts_select_doctor on public.attempts
  for select to authenticated
  using (exists (
    select 1 from public.exams e
     where e.id = attempts.exam_id and e.created_by = auth.uid()
  ));

drop policy if exists attempts_select_admin on public.attempts;
create policy attempts_select_admin on public.attempts
  for select to authenticated
  using (public.is_admin());

-- A student may only open an attempt in his own name, and only as 'in_progress'.
-- A score cannot be written here: submit_attempt() closes the attempt.
drop policy if exists attempts_insert_own on public.attempts;
create policy attempts_insert_own on public.attempts
  for insert to authenticated
  with check (student_id = auth.uid() and status = 'in_progress');

-- No UPDATE / DELETE policy for students on purpose: a student must not be able
-- to rewrite the score after seeing it. submit_attempt() (security definer) is
-- the only writer of score / submitted_at / status.

-- ============================================================================
-- STEP 9 - answers
-- ============================================================================
drop policy if exists answers_select_own on public.answers;
create policy answers_select_own on public.answers
  for select to authenticated
  using (exists (
    select 1 from public.attempts a
     where a.id = answers.attempt_id and a.student_id = auth.uid()
  ));

drop policy if exists answers_select_doctor on public.answers;
create policy answers_select_doctor on public.answers
  for select to authenticated
  using (exists (
    select 1
      from public.attempts a
      join public.exams e on e.id = a.exam_id
     where a.id = answers.attempt_id and e.created_by = auth.uid()
  ));

drop policy if exists answers_select_admin on public.answers;
create policy answers_select_admin on public.answers
  for select to authenticated
  using (public.is_admin());

-- Draft saving while the exam is running (attemptsService.saveAnswer). The
-- attempt must be the caller's own AND still open; the option must belong to the
-- question, which the subquery enforces.
drop policy if exists answers_insert_own_open on public.answers;
create policy answers_insert_own_open on public.answers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.attempts a
       where a.id = answers.attempt_id
         and a.student_id = auth.uid()
         and a.status = 'in_progress'
    )
    and exists (
      select 1 from public.options o
       where o.id = answers.selected_option_id
         and o.question_id = answers.question_id
    )
  );

drop policy if exists answers_update_own_open on public.answers;
create policy answers_update_own_open on public.answers
  for update to authenticated
  using (
    exists (
      select 1 from public.attempts a
       where a.id = answers.attempt_id
         and a.student_id = auth.uid()
         and a.status = 'in_progress'
    )
  )
  with check (
    exists (
      select 1 from public.attempts a
       where a.id = answers.attempt_id
         and a.student_id = auth.uid()
         and a.status = 'in_progress'
    )
    and exists (
      select 1 from public.options o
       where o.id = answers.selected_option_id
         and o.question_id = answers.question_id
    )
  );

drop policy if exists answers_delete_own_open on public.answers;
create policy answers_delete_own_open on public.answers
  for delete to authenticated
  using (
    exists (
      select 1 from public.attempts a
       where a.id = answers.attempt_id
         and a.student_id = auth.uid()
         and a.status = 'in_progress'
    )
  );

-- ============================================================================
-- STEP 10 - security_logs (append-only audit trail)
-- ============================================================================
-- A failed sign-in happens BEFORE a session exists, so that one event must be
-- insertable by an anonymous caller. The policy is narrowed to exactly that event
-- type, so this is not a general anon write channel.
drop policy if exists security_logs_insert_anon on public.security_logs;
create policy security_logs_insert_anon on public.security_logs
  for insert to anon
  with check (event_type = 'LOGIN_FAILED' and length(details) <= 500);

-- Signed-in users write their own events. Which user it is comes from the row
-- itself, and the CHECK keeps event_type to the agreed vocabulary.
drop policy if exists security_logs_insert_authenticated on public.security_logs;
create policy security_logs_insert_authenticated on public.security_logs
  for insert to authenticated
  with check (
    event_type in (
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
      'EXAM_STARTED', 'EXAM_SUBMITTED', 'BLOCKED_ACTION'
    )
    and length(details) <= 500
  );

-- Each user reads only their own history: the email claim inside their JWT.
drop policy if exists security_logs_select_own on public.security_logs;
create policy security_logs_select_own on public.security_logs
  for select to authenticated
  using (user_email = (select auth.jwt() ->> 'email'));

-- No UPDATE / DELETE policy anywhere: the audit log is append-only.

-- ============================================================================
-- STEP 11 - the student-safe view of the options
-- ============================================================================
-- Students must see the four option texts to answer a question, but must not see
-- is_correct. RLS is row-level only, so a column cannot be hidden by a policy;
-- the view exposes the two safe columns and nothing else.
--
-- security_invoker = false means the view runs with its owner's rights (the
-- postgres role used by the SQL Editor, which bypasses RLS), so the join below is
-- the whole filter: options of published exams whose window is open. Students
-- therefore read this view instead of the options table.
drop view if exists public.exam_options_public;
create view public.exam_options_public
with (security_invoker = false) as
select o.id, o.question_id, o.option_text
  from public.options o
  join public.questions q on q.id = o.question_id
  join public.exams e on e.id = q.exam_id
 where e.is_active
   and (e.start_time is null or e.start_time <= now())
   and (e.end_time is null or e.end_time >= now());

revoke all on public.exam_options_public from anon;
grant select on public.exam_options_public to authenticated;

comment on view public.exam_options_public is
  'Option texts for published exams, WITHOUT is_correct - the only option source available to students';

-- ============================================================================
-- VERIFICATION (PLAN.md 6.5) - run these in the SQL Editor as postgres to prove
-- the policies behave. Expected result is written next to each query.
-- ============================================================================
--
-- 1) RLS is on for all eight tables (expect 8 rows, all rowsecurity = true):
--      select tablename, rowsecurity from pg_tables
--       where schemaname = 'public' order by tablename;
--
-- 2) Students get zero rows from the answer key (expect 0):
--      -- run in the browser console while signed in as a student:
--      --   await supabase.from('options').select('is_correct')  -> []  (RLS filters all rows)
--      --   await supabase.from('exam_options_public').select('*') -> the safe columns
--
-- 3) Attempts of another student (expect []):
--      --   await supabase.from('attempts').select('*').eq('student_id', '<other-student-id>')
--
-- 4) Insert an attempt in somebody else's name (expect error 42501 / new row
--    violates row-level security policy):
--      --   await supabase.from('attempts').insert({ exam_id: '<id>', student_id: '<other-id>' })
--
-- 5) Signed out, read exams (expect [] because no anon policy exists):
--      --   await supabase.from('exams').select('*')
--
-- 6) Signed out, write LOGIN_SUCCESS (expect error: policy violation):
--      --   await supabase.from('security_logs').insert({ user_email: 'x@y.z', event_type: 'LOGIN_SUCCESS' })
--      -- while anon INSERT of LOGIN_FAILED must succeed.
--
-- 7) A doctor reading another doctor's attempts (expect []):
--      --   await supabase.from('attempts').select('*').eq('exam_id', '<other-doctors-exam>')
