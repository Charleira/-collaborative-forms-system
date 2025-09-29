-- 01_form_questions.sql
create table if not exists public.form_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  label text not null,            -- "Pergunta" (o texto que aparecerá para o usuário)
  type text not null default 'text',  -- text | textarea | number | email | date | select | checkbox
  required boolean not null default false,
  options jsonb,                  -- para tipos select/checkbox (lista de opções)
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

create index if not exists idx_form_questions_form_id on public.form_questions(form_id);

-- 02_form_responses_add_additional_answers.sql
alter table public.form_responses
