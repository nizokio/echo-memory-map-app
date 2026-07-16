create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.echoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location_name text,
  locality text,
  note text not null default '',
  captured_at timestamptz not null,
  visibility text not null default 'private' check (visibility in ('private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.echo_photos (
  id uuid primary key default gen_random_uuid(),
  echo_id uuid not null references public.echoes(id) on delete cascade,
  storage_path text not null unique,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  unique (echo_id, sort_order)
);

create table public.echo_ai_metadata (
  echo_id uuid primary key references public.echoes(id) on delete cascade,
  title text,
  summary text,
  caption text,
  provider text,
  model text,
  generated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.echo_embeddings (
  echo_id uuid primary key references public.echoes(id) on delete cascade,
  embedding extensions.vector,
  embedding_text text not null default '',
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.echo_tags (
  echo_id uuid not null references public.echoes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (echo_id, tag_id)
);

create index echoes_user_captured_at_idx on public.echoes (user_id, captured_at desc);
create index echoes_user_coordinates_idx on public.echoes (user_id, latitude, longitude);
create index echo_photos_echo_sort_order_idx on public.echo_photos (echo_id, sort_order);
create index tags_user_name_idx on public.tags (user_id, name);
create index echo_tags_tag_id_idx on public.echo_tags (tag_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger echoes_set_updated_at before update on public.echoes for each row execute procedure public.set_updated_at();
create trigger echo_ai_metadata_set_updated_at before update on public.echo_ai_metadata for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.echoes enable row level security;
alter table public.echo_photos enable row level security;
alter table public.echo_ai_metadata enable row level security;
alter table public.echo_embeddings enable row level security;
alter table public.tags enable row level security;
alter table public.echo_tags enable row level security;

create policy "Users can view their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users can manage their own echoes" on public.echoes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can manage photos for their own echoes" on public.echo_photos for all to authenticated using (exists (select 1 from public.echoes where echoes.id = echo_photos.echo_id and echoes.user_id = (select auth.uid()))) with check (exists (select 1 from public.echoes where echoes.id = echo_photos.echo_id and echoes.user_id = (select auth.uid())));
create policy "Users can manage AI metadata for their own echoes" on public.echo_ai_metadata for all to authenticated using (exists (select 1 from public.echoes where echoes.id = echo_ai_metadata.echo_id and echoes.user_id = (select auth.uid()))) with check (exists (select 1 from public.echoes where echoes.id = echo_ai_metadata.echo_id and echoes.user_id = (select auth.uid())));
create policy "Users can manage embeddings for their own echoes" on public.echo_embeddings for all to authenticated using (exists (select 1 from public.echoes where echoes.id = echo_embeddings.echo_id and echoes.user_id = (select auth.uid()))) with check (exists (select 1 from public.echoes where echoes.id = echo_embeddings.echo_id and echoes.user_id = (select auth.uid())));
create policy "Users can manage their own tags" on public.tags for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can manage tags on their own echoes" on public.echo_tags for all to authenticated using (exists (select 1 from public.echoes join public.tags on tags.id = echo_tags.tag_id where echoes.id = echo_tags.echo_id and echoes.user_id = (select auth.uid()) and tags.user_id = (select auth.uid()))) with check (exists (select 1 from public.echoes join public.tags on tags.id = echo_tags.tag_id where echoes.id = echo_tags.echo_id and echoes.user_id = (select auth.uid()) and tags.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('echo-photos', 'echo-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "Users can read their own Echo photos" on storage.objects for select to authenticated using (bucket_id = 'echo-photos' and owner_id = (select auth.uid()));
create policy "Users can upload their own Echo photos" on storage.objects for insert to authenticated with check (bucket_id = 'echo-photos' and owner_id = (select auth.uid()));
create policy "Users can update their own Echo photos" on storage.objects for update to authenticated using (bucket_id = 'echo-photos' and owner_id = (select auth.uid())) with check (bucket_id = 'echo-photos' and owner_id = (select auth.uid()));
create policy "Users can delete their own Echo photos" on storage.objects for delete to authenticated using (bucket_id = 'echo-photos' and owner_id = (select auth.uid()));
