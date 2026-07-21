# Echo

Echo is a mobile-first memory map. Users save real-world memories with photos, notes, GPS coordinates, timestamps, optional AI captions, and voice notes.

Built for OpenAI Build Week.

## MVP Features

- Google sign-in through Supabase Auth
- Create memories with one or more photos, a note, current GPS location, and timestamp
- Home view with albums, recent memories, local search, and nearby memories
- Map view with saved memories
- Memory detail page with photos, typed note, AI caption when available, voice notes, and delete
- Optional Gemini-powered image captioning through a Supabase Edge Function

## Architecture

The app UI does not import Supabase directly.

```text
Screens -> useEchoes -> EchoDataProvider -> EchoRepository -> Supabase
```

This keeps the MVP simple while preserving a clean data boundary.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

3. Run the Expo dev server:

```bash
npx expo start --dev-client -c
```

Use a custom Expo development build, not Expo Go, because Google OAuth redirects and native audio recording need app-specific native configuration.

## Supabase Setup

Run these SQL migrations in order from the Supabase SQL Editor or Supabase CLI:

```text
supabase/migrations/202607160001_create_echo_foundation.sql
supabase/migrations/202607160002_fix_echo_photo_storage_policies.sql
supabase/migrations/202607200001_create_echo_audio_notes.sql
```

They create:

- private Echo tables with RLS
- private `echo-photos` bucket
- private `echo-audio` bucket
- profile bootstrap support
- AI metadata and embedding tables for later AI features

## Google Auth Setup

In Supabase:

1. Open Authentication > Providers.
2. Enable Google.
3. Add the Google Client ID and Client Secret.
4. Open Authentication > URL Configuration.
5. Add the app redirect:

```text
echo://auth/callback
```

In Google Cloud, create a Web OAuth client and add:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

No Android SHA-1 fingerprint is required for this Supabase browser-based OAuth flow.

## Optional AI Captioning

Captioning is optional. Memories still save if caption generation fails.

Set Supabase Edge Function secrets:

```bash
npx supabase secrets set AI_PROVIDER=gemini GEMINI_API_KEY=your-key --project-ref YOUR_PROJECT_REF
```

Deploy the function:

```bash
npx supabase functions deploy caption-echo --project-ref YOUR_PROJECT_REF
```

## Development Builds

Cloud build:

```bash
npx eas-cli build --profile development --platform android
```

Windows local EAS Android builds are not supported. For local Android builds on Windows, install Android Studio and Android SDK, then use:

```bash
npx expo run:android
```

After installing the APK:

```bash
npx expo start --dev-client -c
```

## AI Roadmap

Current MVP uses AI only for optional image captions.

Next AI implementation should be semantic search:

1. Generate embeddings for new memories from note, location text, tags, and AI caption.
2. Store vectors in the existing `echo_embeddings` table.
3. Generate a query embedding when the user searches.
4. Use pgvector to retrieve matching memories.
5. Show ranked results directly, without chat or RAG summaries.

LLM synthesis should come later, only after retrieval works well.
