# Echo

Echo is a mobile-first memory map. Each Echo is a private place-based memory with photos, a note, coordinates, a capture time, and optional tags.

## Architecture

The app UI does not import Supabase directly.

```text
Screens -> useEchoes -> EchoDataProvider -> EchoRepository -> Supabase
```

The existing React Native, React Navigation, and Reanimated UI remains unchanged. The data layer is isolated behind repository interfaces so the backend can change without altering screens or components.

## Supabase foundation

The initial schema and security policies live in `supabase/migrations/202607160001_create_echo_foundation.sql`.

It creates private, RLS-protected profiles, Echoes, photos, tags, AI metadata, and embedding tables, plus the private `echo-photos` Storage bucket.

## Local configuration

1. Create `.env` using `.env.example` as the template.
2. Set `EXPO_PUBLIC_SUPABASE_URL` to your Supabase project URL.
3. Set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key.
4. Apply the migration with the Supabase CLI or the SQL Editor.
5. Run `npm start`.

Until authentication is implemented, the secure RLS policies intentionally leave the app with no visible private Echoes. The UI shows an explicit empty state and never falls back to demo memories.

## Deferred work

Authentication, Echo capture and editing, AI enrichment, embeddings, semantic search, and AR are intentionally not implemented in this foundation.
