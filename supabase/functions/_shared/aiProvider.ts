export type CaptionRequest = {
  imageBase64: string;
  mimeType: string;
};

export type CaptionResult = {
  caption: string;
  provider: string;
  model: string;
};

type AiProvider = {
  generateCaption(request: CaptionRequest): Promise<CaptionResult>;
};

class GeminiProvider implements AiProvider {
  private readonly apiKey = Deno.env.get('GEMINI_API_KEY');
  private readonly model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

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
