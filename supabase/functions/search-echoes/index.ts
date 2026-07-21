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

    const { query, limit } = await request.json();
    if (typeof query !== 'string' || !query.trim()) return json({ error: 'query is required.' }, 400);

    const embedding = await getAiProvider().generateEmbedding({
      text: query.trim(),
      taskType: 'RETRIEVAL_QUERY',
    });

    const { data, error } = await admin.rpc('match_echoes', {
      query_embedding: vectorToSql(embedding.values),
      match_user_id: authData.user.id,
      match_count: Math.max(1, Math.min(Number(limit) || 12, 24)),
    });

    if (error) throw error;

    return json({
      matches: (data || []).map((match: Record<string, unknown>) => ({
        echoId: match.echo_id,
        similarity: match.similarity,
      })),
      provider: embedding.provider,
      model: embedding.model,
    });
  } catch (error) {
    console.error('Search Echoes failed:', error);
    return json({ error: 'Unable to search memories.' }, 500);
  }
});

function vectorToSql(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
