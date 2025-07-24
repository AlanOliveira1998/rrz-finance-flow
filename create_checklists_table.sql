-- Tabela para checklist de rotinas por usuário
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  type text not null check (type in ('Diário', 'Semanal', 'Mensal')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index para busca rápida por usuário
create index if not exists idx_checklists_user_id on checklists(user_id); 