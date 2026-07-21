export type CaptionRequest = {
  imageBase64: string;
  mimeType: string;
};

export type CaptionResult = {
  caption: string;
  provider: string;
  model: string;
};

export type EmbeddingRequest = {
  text: string;
  taskType?: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';
};

export type EmbeddingResult = {
  values: number[];
  provider: string;
  model: string;
};

type AiProvider = {
  generateCaption(request: CaptionRequest): Promise<CaptionResult>;
  generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResult>;
};

class GeminiProvider implements AiProvider {
  private readonly apiKey = Deno.env.get('GEMINI_API_KEY');
  private readonly model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
  private readonly embeddingModel = Deno.env.get('GEMINI_EMBEDDING_MODEL') || 'gemini-embedding-2';
  private readonly embeddingDimensions = Number(Deno.env.get('GEMINI_EMBEDDING_DIMENSIONS') || '768');

  async generateCaption({ imageBase64, mimeType }: CaptionRequest): Promise<CaptionResult> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not configured.');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Write one short, factual sentence that captions this personal memory photo. Do not identify people, speculate, add labels, or use more than one sentence.',
                },
                { inlineData: { mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 60,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini caption request failed:', response.status, await response.text());
      throw new Error('Gemini caption request failed.');
    }

    const data = await response.json();
    const caption = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();

    if (!caption) throw new Error('Gemini returned an empty caption.');

    return { caption: firstSentence(caption), provider: 'gemini', model: this.model };
  }

  async generateEmbedding({ text, taskType = 'RETRIEVAL_DOCUMENT' }: EmbeddingRequest): Promise<EmbeddingResult> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not configured.');
    if (!text.trim()) throw new Error('Embedding text is empty.');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
          taskType,
          outputDimensionality: this.embeddingDimensions,
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini embedding request failed:', response.status, await response.text());
      throw new Error('Gemini embedding request failed.');
    }

    const data = await response.json();
    const values = data.embedding?.values || data.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length === 0) throw new Error('Gemini returned an empty embedding.');

    return { values, provider: 'gemini', model: this.embeddingModel };
  }
}

export function getAiProvider(): AiProvider {
  const provider = Deno.env.get('AI_PROVIDER')?.toLowerCase();

  if (provider === 'gemini') return new GeminiProvider();
  throw new Error(`Unsupported AI_PROVIDER: ${provider || 'not configured'}.`);
}

function firstSentence(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const sentenceEnd = normalized.search(/[.!?](?:\s|$)/);
  return sentenceEnd === -1 ? normalized : normalized.slice(0, sentenceEnd + 1);
}
