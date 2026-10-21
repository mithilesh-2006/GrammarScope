import type {
  GrammarValidateResponse,
  ParseResponse,
  StringAmbiguityResponse,
  GrammarAmbiguityResponse,
  FirstFollowResponse,
  CYKResponse,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.detail) {
        errMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async checkHealth(): Promise<{ status: string; app: string; version: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(res);
  },

  async validateGrammar(grammar: string, startSymbol?: string): Promise<GrammarValidateResponse> {
    const res = await fetch(`${API_BASE_URL}/grammar/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grammar, start_symbol: startSymbol || undefined }),
    });
    return handleResponse<GrammarValidateResponse>(res);
  },

  async parseString(
    grammar: string,
    inputString: string,
    startSymbol?: string,
    tokenMode: string = 'auto',
    maxTrees: number = 10
  ): Promise<ParseResponse> {
    const res = await fetch(`${API_BASE_URL}/parser/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grammar,
        input_string: inputString,
        start_symbol: startSymbol || undefined,
        token_mode: tokenMode,
        max_trees: maxTrees,
      }),
    });
    return handleResponse<ParseResponse>(res);
  },

  async analyzeStringAmbiguity(
    grammar: string,
    inputString: string,
    startSymbol?: string,
    tokenMode: string = 'auto',
    maxTrees: number = 10
  ): Promise<StringAmbiguityResponse> {
    const res = await fetch(`${API_BASE_URL}/ambiguity/string`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grammar,
        input_string: inputString,
        start_symbol: startSymbol || undefined,
        token_mode: tokenMode,
        max_trees: maxTrees,
      }),
    });
    return handleResponse<StringAmbiguityResponse>(res);
  },

  async searchGrammarAmbiguity(
    grammar: string,
    startSymbol?: string,
    maxTokens: number = 8,
    maxCandidates: number = 200,
    timeoutSeconds: number = 4.0
  ): Promise<GrammarAmbiguityResponse> {
    const res = await fetch(`${API_BASE_URL}/ambiguity/grammar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grammar,
        start_symbol: startSymbol || undefined,
        max_tokens: maxTokens,
        max_candidates: maxCandidates,
        timeout_seconds: timeoutSeconds,
      }),
    });
    return handleResponse<GrammarAmbiguityResponse>(res);
  },

  async getFirstFollow(grammar: string, startSymbol?: string): Promise<FirstFollowResponse> {
    const res = await fetch(`${API_BASE_URL}/grammar/first-follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grammar, start_symbol: startSymbol || undefined }),
    });
    return handleResponse<FirstFollowResponse>(res);
  },

  async runCYK(
    grammar: string,
    inputString: string,
    tokenMode: string = 'auto'
  ): Promise<CYKResponse> {
    const res = await fetch(`${API_BASE_URL}/parser/cyk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grammar, input_string: inputString, token_mode: tokenMode }),
    });
    return handleResponse<CYKResponse>(res);
  },
};
