import { ChatMessage, GroundingChunk, CalculationResult } from '../types';

export interface GeminiResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
  calculationResult?: CalculationResult;
}

export async function getGeminiResponse(
  prompt: string,
  history: ChatMessage[]
): Promise<GeminiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      history,
    }),
  });

  if (!response.ok) {
    let errorDetails = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) {
        errorDetails = data.error;
      }
    } catch {
      // Ignore JSON parse error on non-JSON response
    }
    throw new Error(errorDetails);
  }

  const data: GeminiResponse = await response.json();
  return data;
}
