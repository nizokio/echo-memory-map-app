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
      .select(`
        id,
        user_id,
        location_name,
        locality,
        note,
        captured_at,
        echo_ai_metadata (title, summary, caption),
        echo_tags (tag:tags (name))
      `)
      .eq('id', echoId)
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (echoError) throw echoError;
    if (!echo) return json({ error: 'Echo not found.' }, 404);

    const embeddingText = buildEmbeddingText(echo);
    if (!embeddingText) return json({ error: 'Echo has no text to embed.' }, 400);

    const embedding = await getAiProvider().generateEmbedding({
      text: embeddingText,
      taskType: 'RETRIEVAL_DOCUMENT',
    });

    const { error: embeddingError } = await admin.from('echo_embeddings').upsert(
      {
        echo_id: echo.id,
        embedding: vectorToSql(embedding.values),
        embedding_text: embeddingText,
        provider: embedding.provider,
        model: embedding.model,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'echo_id' }
    );

    if (embeddingError) throw embeddingError;
    return json({ status: 'embedded', echoId: echo.id });
  } catch (error) {
    console.error('Embed Echo failed:', error);
    return json({ error: 'Unable to embed memory.' }, 500);
  }
});

function buildEmbeddingText(echo: Record<string, any>) {
  const metadata = Array.isArray(echo.echo_ai_metadata) ? echo.echo_ai_metadata[0] : echo.echo_ai_metadata;
  const tags = (echo.echo_tags || []).map((entry: Record<string, any>) => entry.tag?.name).filter(Boolean);

  return [
    echo.note,
    echo.location_name,
    echo.locality,
    metadata?.title,
    metadata?.summary,
    metadata?.caption,
    ...tags,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}

function vectorToSql(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
