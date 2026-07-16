drop policy if exists "Users can read their own Echo photos" on storage.objects;
drop policy if exists "Users can upload their own Echo photos" on storage.objects;
drop policy if exists "Users can update their own Echo photos" on storage.objects;
drop policy if exists "Users can delete their own Echo photos" on storage.objects;

create policy "Users can read their own Echo photos" on storage.objects
for select to authenticated
using (bucket_id = 'echo-photos' and owner_id = (select auth.uid()::text));

create policy "Users can upload their own Echo photos" on storage.objects
for insert to authenticated
with check (bucket_id = 'echo-photos' and owner_id = (select auth.uid()::text));

create policy "Users can update their own Echo photos" on storage.objects
for update to authenticated
using (bucket_id = 'echo-photos' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'echo-photos' and owner_id = (select auth.uid()::text));

create policy "Users can delete their own Echo photos" on storage.objects
for delete to authenticated
using (bucket_id = 'echo-photos' and owner_id = (select auth.uid()::text));
