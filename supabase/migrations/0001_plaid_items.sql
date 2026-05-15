create table if not exists public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null unique,
  access_token text not null,
  institution_id text,
  institution_name text,
  created_at timestamptz not null default now()
);

create index if not exists plaid_items_user_id_idx on public.plaid_items (user_id);

alter table public.plaid_items enable row level security;

create policy "Users can read their own plaid items"
  on public.plaid_items
  for select
  using (auth.uid() = user_id);

create policy "Users can delete their own plaid items"
  on public.plaid_items
  for delete
  using (auth.uid() = user_id);
