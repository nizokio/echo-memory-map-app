create table public.echo_audio_notes (
  id uuid primary key default gen_random_uuid(),
  echo_id uuid not null references public.echoes(id) on delete cascade,
  storage_path text not null unique,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (echo_id, sort_order)
);

create index echo_audio_notes_echo_sort_order_idx on public.echo_audio_notes (echo_id, sort_order);

alter table public.echo_audio_notes enable row level security;

create policy "Users can manage audio notes for their own echoes" on public.echo_audio_notes
for all to authenticated
using (exists (
  select 1 from public.echoes
  where echoes.id = echo_audio_notes.echo_id
  and echoes.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.echoes
  where echoes.id = echo_audio_notes.echo_id
  and echoes.user_id = (select auth.uid())
));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'echo-audio',
  'echo-audio',
  false,
  10485760,
  array['audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/webm', 'audio/3gpp']
)
on conflict (id) do nothing;

create policy "Users can read their own Echo audio" on storage.objects
for select to authenticated
using (bucket_id = 'echo-audio' and owner_id = (select auth.uid()::text));

create policy "Users can upload their own Echo audio" on storage.objects
for insert to authenticated
with check (bucket_id = 'echo-audio' and owner_id = (select auth.uid()::text));

create policy "Users can update their own Echo audio" on storage.objects
for update to authenticated
using (bucket_id = 'echo-audio' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'echo-audio' and owner_id = (select auth.uid()::text));

create policy "Users can delete their own Echo audio" on storage.objects
for delete to authenticated
using (bucket_id = 'echo-audio' and owner_id = (select auth.uid()::text));
