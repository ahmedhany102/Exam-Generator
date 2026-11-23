-- ============================================================================
-- 01_schema.sql - Online Examination System: tables, trigger and grading function
-- Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
-- ----------------------------------------------------------------------------
-- MILESTONE M1 - fully implemented.
--
-- Run order in the Supabase SQL Editor:
--   1. 01_schema.sql     <- this file
--   2. 02_rls.sql         (helper functions + Row Level Security policies)
--   3. 04_seed_exams.sql  (Ibrahim Abduljawad, member4: 2 subjects, 2 exams)
--
-- The file is written to be safe to re-run on a fresh project: every object is
-- created with "if not exists", "create or replace" or dropped first. It is NOT
-- a migration tool - changing a column later means a new ALTER statement.
--
-- Design rules this file encodes (PLAN.md 4.1):
--   * one attempt per student per exam     -> unique (exam_id, student_id)
--   * one answer per question per attempt  -> unique (attempt_id, question_id)
--   * the answer key never leaves the DB   -> grading runs in submit_attempt()
-- ============================================================================

-- gen_random_uuid() ships with pgcrypto; Supabase has it enabled already, the
-- "if not exists" makes the file runnable on any PostgreSQL 13+ as well.
create extension if not exists pgcrypto;

-- ============================================================================
-- 1) profiles - one row per authenticated user, written by the signup trigger
-- ============================================================================
create table if not exists public.profiles (
  -- The primary key IS the auth user id: that makes every policy a simple
  -- comparison (auth.uid() = id) and removes a second unique index.
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text not null,
  -- The three roles of the system. A visitor can never choose this value:
  -- the signup trigger below hard-codes 'student'.
  role       text not null default 'student'
             check (role in ('student', 'doctor', 'admin')),
  -- Admin can close an account without deleting the exam history behind it.
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'student | doctor | admin - written by the signup trigger or by an admin, never by the browser form';

-- ============================================================================
-- 2) subjects - what an exam is about, optionally assigned to one doctor
-- ============================================================================
create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,          -- 'CS201' - the duplicate check the admin page shows
  doctor_id  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3) exams - an exam belongs to a subject and to the doctor who created it
-- ============================================================================
create table if not exists public.exams (
  id               uuid primary key default gen_random_uuid(),
  subject_id       uuid not null references public.subjects (id) on delete cascade,
  title            text not null,
  description      text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  total_marks      integer not null check (total_marks > 0),
  start_time       timestamptz,   -- null = open immediately
  end_time         timestamptz,   -- null = no deadline
  created_by       uuid not null references public.profiles (id) on delete cascade,
  is_active        boolean not null default true,   -- the "published" flag
  created_at       timestamptz not null default now(),
  -- A window that ends before it starts is a data-entry bug, not an exam.
  constraint exams_window_check check (end_time is null or start_time is null or end_time > start_time)
);

-- ============================================================================
-- 4) questions - five per exam in the seed data; order_index drives display
-- ============================================================================
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid not null references public.exams (id) on delete cascade,
  question_text text not null,
  marks         integer not null check (marks > 0),
  order_index   integer not null default 1,
  constraint questions_order_unique unique (exam_id, order_index)
);

-- ============================================================================
-- 5) options - four per question, exactly one with is_correct = true
-- ============================================================================
-- "Exactly one correct" cannot be a CHECK (it spans rows). utils/validateExam.js
-- (Ahmed Fayez, member3) refuses the exam on the client, and the grading function
-- simply scores whatever is flagged - a question with no correct option is worth
-- zero marks and therefore fails the "sum(marks) = total_marks" rule.
create table if not exists public.options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  option_text text not null,
  is_correct  boolean not null default false
);

-- ============================================================================
-- 6) attempts - one student, one exam, one row
-- ============================================================================
create table if not exists public.attempts (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz,
  score        integer check (score is null or score >= 0),
  status       text not null default 'in_progress'
               check (status in ('in_progress', 'submitted', 'auto_submitted')),
  -- The real "one attempt only" rule. The button in the UI is only a courtesy:
  -- this constraint is what rejects the second row.
  constraint attempts_one_per_student unique (exam_id, student_id)
);

-- ============================================================================
-- 7) answers - the option the student picked for one question
-- ============================================================================
create table if not exists public.answers (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.attempts (id) on delete cascade,
  question_id        uuid not null references public.questions (id) on delete cascade,
  selected_option_id uuid references public.options (id) on delete set null,
  constraint answers_one_per_question unique (attempt_id, question_id)
);

-- ============================================================================
-- 8) security_logs - append-only audit trail
-- ============================================================================
-- No foreign key on user_email on purpose: a failed sign-in has no profile row
-- yet, and the row must still be written. There is no UPDATE/DELETE policy, so
-- the table is append-only even for an admin.
create table if not exists public.security_logs (
  id         uuid primary key default gen_random_uuid(),
  user_email text,
  event_type text not null,
  details    text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES - the columns the dashboards and RLS policies filter on
-- ============================================================================
create index if not exists exams_created_by_idx      on public.exams (created_by);
create index if not exists exams_subject_id_idx      on public.exams (subject_id);
create index if not exists questions_exam_id_idx     on public.questions (exam_id);
create index if not exists options_question_id_idx   on public.options (question_id);
create index if not exists attempts_exam_id_idx      on public.attempts (exam_id);
create index if not exists attempts_student_id_idx   on public.attempts (student_id);
create index if not exists answers_attempt_id_idx    on public.answers (attempt_id);
create index if not exists answers_question_id_idx   on public.answers (question_id);
create index if not exists subjects_doctor_id_idx    on public.subjects (doctor_id);
create index if not exists security_logs_email_idx   on public.security_logs (user_email);
create index if not exists security_logs_created_idx on public.security_logs (created_at desc);

-- ============================================================================
-- SIGNUP TRIGGER - every new auth user gets a profiles row, role 'student'
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer              -- runs before a session exists, so RLS would block it
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    -- Hard-coded on purpose: the role is NEVER read from the request, so a
    -- visitor cannot register as a doctor or an admin. Promotion is an admin
    -- action on the profiles table.
    'student'
  )
  on conflict (id) do nothing;   -- makes the trigger safe if a profile exists

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- GRADING FUNCTION - the only server-side behaviour of the system
-- ============================================================================
-- Why this exists at all: students may never SELECT options.is_correct, so the
-- score cannot be computed in the browser. submit_attempt() runs with definer
-- rights, grades the submitted answers, closes the attempt and returns the
-- result. It is the single place where the answer key is compared.
--
-- Input:
--   p_attempt_id    the attempt being submitted (must belong to the caller)
--   p_answers       jsonb array: [{"question_id": "...", "selected_option_id": "..."}]
--   p_auto_submitted true when the browser timer ran out
-- Output (jsonb):
--   {"score": int, "total": int, "correctCount": int, "questionCount": int}
create or replace function public.submit_attempt(
  p_attempt_id uuid,
  p_answers jsonb,
  p_auto_submitted boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid            uuid := auth.uid();
  v_attempt        public.attempts;
  v_score          integer := 0;
  v_total          integer := 0;
  v_correct_count  integer := 0;
  v_question_count integer := 0;
  v_answer         record;
begin
  -- 1. The caller must be a signed-in user.
  if v_uid is null then
    raise exception 'You must be signed in to submit an exam.' using errcode = '28000';
  end if;

  -- 2. The attempt must exist and belong to the caller. Reading it directly is
  --    safe: this function is security definer, so RLS does not filter it.
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found then
    raise exception 'That attempt does not exist.' using errcode = 'P0002';
  end if;
  if v_attempt.student_id <> v_uid then
    raise exception 'That attempt belongs to another student.' using errcode = '42501';
  end if;

  -- 3. Already submitted: return the stored result instead of raising, so a
  --    double click or a retried request is harmless (idempotent submit).
  if v_attempt.status <> 'in_progress' then
    select coalesce(sum(q.marks), 0) into v_total
      from public.questions q where q.exam_id = v_attempt.exam_id;
    select count(*) into v_question_count
      from public.questions q where q.exam_id = v_attempt.exam_id;
    return jsonb_build_object(
      'score', coalesce(v_attempt.score, 0),
      'total', v_total,
      'correctCount', 0,
      'questionCount', v_question_count
    );
  end if;

  -- 4. Save the answers that arrived with the submit. The join is the guard:
  --    an option that does not belong to the question, or a question that does
  --    not belong to this exam, simply produces no row.
  if p_answers is not null and jsonb_typeof(p_answers) = 'array' then
    for v_answer in
      select * from jsonb_to_recordset(p_answers)
        as x(question_id uuid, selected_option_id uuid)
    loop
      insert into public.answers (attempt_id, question_id, selected_option_id)
      select p_attempt_id, q.id, o.id
        from public.questions q
        join public.options o
          on o.id = v_answer.selected_option_id
         and o.question_id = q.id
       where q.id = v_answer.question_id
         and q.exam_id = v_attempt.exam_id
      on conflict (attempt_id, question_id)
        do update set selected_option_id = excluded.selected_option_id;
    end loop;
  end if;

  -- 5. Grade every question of the exam. A left join keeps unanswered questions
  --    in the count, so they cost their marks and never break the maths.
  select
    coalesce(sum(q.marks) filter (
      where a.selected_option_id is not null
        and exists (
          select 1 from public.options o
           where o.id = a.selected_option_id
             and o.question_id = q.id
             and o.is_correct
        )
    ), 0),
    count(*) filter (
      where a.selected_option_id is not null
        and exists (
          select 1 from public.options o
           where o.id = a.selected_option_id
             and o.question_id = q.id
             and o.is_correct
        )
    ),
    coalesce(sum(q.marks), 0),
    count(*)
  into v_score, v_correct_count, v_total, v_question_count
  from public.questions q
  left join public.answers a
    on a.attempt_id = p_attempt_id
   and a.question_id = q.id
  where q.exam_id = v_attempt.exam_id;

  -- 6. Close the attempt. Only this function ever writes score/submitted_at,
  --    which is why there is no UPDATE policy on attempts for students.
  update public.attempts
     set score        = v_score,
         submitted_at = now(),
         status       = case when p_auto_submitted then 'auto_submitted' else 'submitted' end
   where id = p_attempt_id;

  return jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'correctCount', v_correct_count,
    'questionCount', v_question_count
  );
end;
$$;

-- A security definer function is a privilege escalation if an anonymous caller
-- may execute it. Only signed-in users may grade, and nobody else can replace it.
revoke all on function public.submit_attempt(uuid, jsonb, boolean) from public;
grant execute on function public.submit_attempt(uuid, jsonb, boolean) to authenticated;

-- ============================================================================
-- FINAL CHECK - run this after the script and expect 8 rows, names in order:
-- profiles, subjects, exams, questions, options, attempts, answers, security_logs
-- ============================================================================
--   select table_name from information_schema.tables
--    where table_schema = 'public' order by table_name;
--
-- Also expect the trigger and the function to exist:
--   select tgname from pg_trigger where tgname = 'on_auth_user_created';
--   select proname from pg_proc where proname = 'submit_attempt';
