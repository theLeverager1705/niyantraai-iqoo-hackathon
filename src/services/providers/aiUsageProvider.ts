import type { AIInteraction, AITool, IntegrationStatus } from '@/types';

/**
 * AI Usage Provider - the seam between NiyantraAI and where AI activity
 * actually comes from.
 *
 * The prototype ships one implementation (simulated). Real providers slot in
 * behind the same interface:
 *
 *   - An editor extension (VS Code / Cursor / JetBrains) that reports
 *     accept / reject / edit events on AI completions. This is the only
 *     source that can observe acceptance and modification directly.
 *   - GitHub, via commit and PR metadata plus co-authorship trailers.
 *   - ChatGPT / Claude / Gemini conversation exports the user uploads
 *     themselves.
 *
 * What NiyantraAI deliberately does NOT claim: there is no public API that
 * grants a third party access to someone's private ChatGPT or Claude history.
 * Any real integration is either user-initiated (an export they hand over) or
 * client-side (an extension running in their own editor with their consent).
 * The UI labels simulated sources as such rather than implying otherwise.
 */

export interface UsageQuery {
  since: Date;
  until?: Date;
  tools?: AITool[];
}

export interface AIUsageProvider {
  readonly id: string;
  readonly label: string;
  readonly mode: 'simulated' | 'live';
  /** Whether this provider can currently be queried. */
  isAvailable(): boolean;
  fetchInteractions(query: UsageQuery): Promise<AIInteraction[]>;
  describe(): IntegrationStatus[];
}

class ProviderRegistry {
  private providers = new Map<string, AIUsageProvider>();
  private activeId: string | null = null;

  register(provider: AIUsageProvider): void {
    this.providers.set(provider.id, provider);
    if (!this.activeId) this.activeId = provider.id;
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Unknown AI usage provider: ${id}`);
    }
    this.activeId = id;
  }

  get active(): AIUsageProvider {
    const provider = this.activeId ? this.providers.get(this.activeId) : undefined;
    if (!provider) {
      throw new Error('No AI usage provider registered');
    }
    return provider;
  }

  list(): AIUsageProvider[] {
    return [...this.providers.values()];
  }
}

export const usageProviders = new ProviderRegistry();

/**
 * The integration surface shown in Settings. Availability is stated honestly:
 * what exists today, what needs an extension, what is roadmap.
 */
export const INTEGRATION_CATALOGUE: IntegrationStatus[] = [
  {
    id: 'vscode',
    label: 'VS Code / Cursor extension',
    description:
      'Observes suggestion accept, reject and edit events locally. The only source that can measure whether generated code was actually read.',
    connected: false,
    mode: 'simulated',
    capability: 'Acceptance, modification, manual-vs-generated line counts',
    availability: 'requires-extension',
  },
  {
    id: 'github',
    label: 'GitHub',
    description:
      'Repository structure, languages, commit cadence and co-authorship trailers used to infer AI-assisted commits.',
    connected: false,
    mode: 'simulated',
    capability: 'Repository analysis, project-specific question generation',
    availability: 'available',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    description:
      'Conversation export that you upload yourself. There is no API that grants third-party access to your chat history.',
    connected: false,
    mode: 'simulated',
    capability: 'Prompt text, category, timestamps',
    availability: 'planned',
  },
  {
    id: 'claude',
    label: 'Claude',
    description:
      'Conversation export that you upload yourself, or MCP-based instrumentation inside your own tooling.',
    connected: false,
    mode: 'simulated',
    capability: 'Prompt text, category, timestamps',
    availability: 'planned',
  },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    description:
      'Acceptance telemetry is available to organisation owners through the Copilot metrics API, not to individuals.',
    connected: false,
    mode: 'simulated',
    capability: 'Acceptance rate, suggestion volume (org-level)',
    availability: 'planned',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    description: 'User-supplied export. Same constraint as the other assistants.',
    connected: false,
    mode: 'simulated',
    capability: 'Prompt text, category, timestamps',
    availability: 'planned',
  },
];
