import type { AIInteraction, IntegrationStatus } from '@/types';
import { buildDemoInteractions } from '@/data/demoDataset';
import {
  INTEGRATION_CATALOGUE,
  usageProviders,
  type AIUsageProvider,
  type UsageQuery,
} from './aiUsageProvider';

/**
 * The prototype's AI usage provider. Reads the seeded dataset and applies the
 * same query filtering a real provider would, so nothing downstream knows it
 * is talking to simulated data.
 */
class SimulatedUsageProvider implements AIUsageProvider {
  readonly id = 'simulated';
  readonly label = 'Simulated AI Activity';
  readonly mode = 'simulated' as const;

  private cache: { reference: number; data: AIInteraction[] } | null = null;

  isAvailable(): boolean {
    return true;
  }

  private dataset(reference: Date): AIInteraction[] {
    const key = reference.setHours(0, 0, 0, 0);
    if (this.cache?.reference === key) return this.cache.data;
    const data = buildDemoInteractions(new Date(key));
    this.cache = { reference: key, data };
    return data;
  }

  async fetchInteractions(query: UsageQuery): Promise<AIInteraction[]> {
    // A tiny delay keeps the loading states on the real code path.
    await new Promise((resolve) => setTimeout(resolve, 120));
    const all = this.dataset(new Date(query.until ?? Date.now()));
    const since = query.since.getTime();
    const until = (query.until ?? new Date()).getTime();
    return all.filter((i) => {
      const t = new Date(i.timestamp).getTime();
      if (t < since || t > until) return false;
      if (query.tools?.length && !query.tools.includes(i.tool)) return false;
      return true;
    });
  }

  describe(): IntegrationStatus[] {
    return INTEGRATION_CATALOGUE.map((entry) => ({ ...entry, mode: 'simulated' }));
  }
}

export const simulatedUsageProvider = new SimulatedUsageProvider();
usageProviders.register(simulatedUsageProvider);
