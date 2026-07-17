import { createClient } from 'npm:@supabase/supabase-js@2';
import { getAiProvider } from '../_shared/aiProvider.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase function environment is incomplete.');

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Unauthorized.' }, 401);

    const { echoId } = await request.json();
    if (typeof echoId !== 'string' || !echoId) return json({ error: 'echoId is required.' }, 400);

    const { data: echo, error: echoError } = await admin
      .from('echoes')
      .select('id, user_id, echo_ai_metadata (caption)')
      .eq('id', echoId)
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (echoError) throw echoError;
    if (!echo) return json({ error: 'Echo not found.' }, 404);
    if (echo.echo_ai_metadata?.caption) return json({ status: 'already_captioned', caption: echo.echo_ai_metadata.caption });

    const { data: photo, error: photoError } = await admin
      .from('echo_photos')
      .select('storage_path')
      .eq('echo_id', echo.id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (photoError) throw photoError;
    if (!photo) return json({ error: 'Echo has no photo.' }, 400);

    const { data: image, error: imageError } = await admin.storage.from('echo-photos').download(photo.storage_path);
    if (imageError) throw imageError;

    const caption = await getAiProvider().generateCaption({
      imageBase64: arrayBufferToBase64(await image.arrayBuffer()),
      mimeType: image.type || getMimeType(photo.storage_path),
    });

    const { error: metadataError } = await admin.from('echo_ai_metadata').upsert(
      {
        echo_id: echo.id,
        caption: caption.caption,
        provider: caption.provider,
        model: caption.model,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'echo_id' }
    );

    if (metadataError) throw metadataError;
    return json({ status: 'captioned', caption: caption.caption });
  } catch (error) {
    console.error('Caption Echo failed:', error);
    return json({ error: 'Unable to generate a caption.' }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function getMimeType(storagePath: string) {
  const extension = storagePath.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic') return 'image/heic';
  return 'image/jpeg';
}
