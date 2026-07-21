set search_path = public, extensions;

alter table public.echo_embeddings
alter column embedding type extensions.vector(768)
using embedding::extensions.vector(768);

create index if not exists echo_embeddings_embedding_idx
on public.echo_embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function public.match_echoes(
  query_embedding extensions.vector(768),
  match_user_id uuid,
  match_count integer default 12
)
returns table (
  echo_id uuid,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    echo_embeddings.echo_id,
    1 - (echo_embeddings.embedding <=> query_embedding) as similarity
  from public.echo_embeddings
  join public.echoes on echoes.id = echo_embeddings.echo_id
  where echoes.user_id = match_user_id
  and echo_embeddings.embedding is not null
  order by echo_embeddings.embedding <=> query_embedding
  limit greatest(1, least(match_count, 24));
$$;
