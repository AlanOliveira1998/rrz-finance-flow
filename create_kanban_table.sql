-- Tabela para tarefas do Kanban de Atividades por usuário
create table if not exists kanban_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  text text not null,
  status text not null check (status in ('todo', 'doing', 'done')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_kanban_tasks_user_id on kanban_tasks(user_id); 