export enum MessageAuthor {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface CalculationInput {
  name: string;
  value: number;
  unit: string;
}

export interface CalculationResult {
  calculationName: string;
  inputs: CalculationInput[];
  result: {
    name: string;
    value: number | string;
    unit: string;
  };
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
  groundingChunks?: GroundingChunk[];
  calculationResult?: CalculationResult;
}
