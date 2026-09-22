/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional: enables the remote LLM evaluator in services/llm. */
  readonly VITE_LLM_API_KEY?: string;
  readonly VITE_LLM_BASE_URL?: string;
  readonly VITE_LLM_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
