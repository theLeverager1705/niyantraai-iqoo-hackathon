import type {
  AIInteraction,
  AITool,
  AssistanceLevel,
  PromptCategory,
} from '@/types';
import { chance, createRng, randInt } from '@/lib/utils';
import { SEED_PROMPTS } from './promptBank';

/**
 * Simulated AI activity for the demo profile.
 *
 * This is the ONLY place the prototype invents behaviour. Everything the
 * product displays is derived from these records by the real analytics
 * engine, so swapping this generator for a live provider (see
 * services/providers) produces a working product with no other changes.
 *
 * Behavioural rates (attempt-first, edit rate, follow-up rate) are assigned by
 * exact quota rather than by independent coin flips. With ~90 records a week,
 * Bernoulli sampling noise is large enough to invert the week-over-week story
 * the demo is supposed to tell, so the generator picks *which* interactions
 * carry each flag using a realistic propensity ranking, while guaranteeing the
 * aggregate rate.
 */

export const DEMO_SEED = 20260922;
export const WINDOW_DAYS = 7;
export const TOTAL_DAYS = 14;

interface WeekProfile {
  /** Relative frequency of each prompt category. */
  mix: Record<PromptCategory, number>;
  /** Exact share of interactions where the problem was attempted first. */
  attemptShare: number;
  /** Exact share of accepted suggestions that were edited before being kept. */
  modifyShare: number;
  /** Exact share of interactions followed by a clarifying question. */
  followUpShare: number;
  /** Requests per day, Monday to Sunday. */
  volume: number[];
}

const CURRENT_WEEK: WeekProfile = {
  mix: {
    'complete-solution': 0.22,
    'code-generation': 0.4,
    debugging: 0.16,
    explanation: 0.09,
    learning: 0.06,
    architecture: 0.04,
    optimization: 0.03,
  },
  attemptShare: 0.3,
  modifyShare: 0.46,
  followUpShare: 0.5,
  volume: [14, 17, 12, 19, 15, 8, 6],
};

const PREVIOUS_WEEK: WeekProfile = {
  mix: {
    'complete-solution': 0.3,
    'code-generation': 0.4,
    debugging: 0.14,
    explanation: 0.07,
    learning: 0.03,
    architecture: 0.04,
    optimization: 0.02,
  },
  attemptShare: 0.14,
  modifyShare: 0.26,
  followUpShare: 0.38,
  volume: [16, 18, 14, 19, 16, 9, 7],
};

/** Typical handover level per category (1 = you reasoned, 5 = AI produced it). */
const ASSISTANCE: Record<PromptCategory, [number, number]> = {
  'complete-solution': [5, 5],
  'code-generation': [4, 5],
  debugging: [3, 3],
  architecture: [2, 3],
  optimization: [3, 3],
  explanation: [2, 2],
  learning: [1, 2],
};

/** Lines produced by the assistant / written by hand, per category. */
const CODE_VOLUME: Record<
  PromptCategory,
  { gen: [number, number]; manual: [number, number] }
> = {
  'complete-solution': { gen: [90, 160], manual: [3, 12] },
  'code-generation': { gen: [35, 80], manual: [8, 25] },
  debugging: { gen: [8, 28], manual: [18, 45] },
  architecture: { gen: [0, 15], manual: [10, 30] },
  optimization: { gen: [10, 30], manual: [12, 30] },
  explanation: { gen: [0, 8], manual: [15, 40] },
  learning: { gen: [0, 5], manual: [20, 50] },
};

/** Where the developer is realistically more likely to have tried first. */
const ATTEMPT_PROPENSITY: Record<PromptCategory, number> = {
  debugging: 0.9,
  explanation: 0.8,
  learning: 0.8,
  optimization: 0.5,
  architecture: 0.45,
  'code-generation': 0.25,
  'complete-solution': 0.05,
};

/** Categories that naturally invite a clarifying follow-up. */
const FOLLOW_UP_PROPENSITY: Record<PromptCategory, number> = {
  learning: 0.9,
  explanation: 0.85,
  debugging: 0.7,
  architecture: 0.6,
  optimization: 0.45,
  'code-generation': 0.3,
  'complete-solution': 0.15,
};

const DEMO_TOOLS: { tool: AITool; weight: number }[] = [
  { tool: 'chatgpt', weight: 0.4 },
  { tool: 'claude', weight: 0.34 },
  { tool: 'copilot', weight: 0.26 },
];

/**
 * Build a bag containing exactly `total` categories in the requested
 * proportions (largest-remainder allocation), then shuffle it. Drawing from
 * the bag gives the demo an exact, reproducible category mix instead of one
 * that wanders by several points every time the seed shifts.
 */
function buildCategoryBag(
  rng: () => number,
  mix: Record<PromptCategory, number>,
  total: number,
): PromptCategory[] {
  const entries = Object.entries(mix) as [PromptCategory, number][];
  const exact = entries.map(([category, share]) => ({
    category,
    ideal: share * total,
  }));
  const allocated = exact.map((e) => ({ ...e, count: Math.floor(e.ideal) }));
  let remaining = total - allocated.reduce((acc, e) => acc + e.count, 0);
  allocated
    .slice()
    .sort((a, b) => b.ideal - Math.floor(b.ideal) - (a.ideal - Math.floor(a.ideal)))
    .forEach((entry) => {
      if (remaining > 0) {
        entry.count += 1;
        remaining -= 1;
      }
    });

  const bag: PromptCategory[] = [];
  allocated.forEach((e) => {
    for (let i = 0; i < e.count; i += 1) bag.push(e.category);
  });

  // Deterministic Fisher-Yates shuffle.
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function pickTool(rng: () => number): AITool {
  let roll = rng();
  for (const { tool, weight } of DEMO_TOOLS) {
    roll -= weight;
    if (roll <= 0) return tool;
  }
  return 'chatgpt';
}

/**
 * Turn exactly `share` of `items` on, choosing the most plausible candidates
 * first so the pattern still looks like a person rather than a quota.
 */
function assignByQuota<T>(
  items: T[],
  share: number,
  propensity: (item: T) => number,
  apply: (item: T, value: boolean) => void,
): void {
  if (!items.length) return;
  const target = Math.round(share * items.length);
  const ranked = items
    .map((item, index) => ({ item, index, weight: propensity(item) }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  ranked.forEach(({ item }, rank) => apply(item, rank < target));
}

/** Local midnight `daysAgo` days before `reference`. */
export function dayStart(reference: Date, daysAgo: number): Date {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export function buildDemoInteractions(
  reference: Date = new Date(),
  seed = DEMO_SEED,
): AIInteraction[] {
  const rng = createRng(seed);
  const all: AIInteraction[] = [];
  const weeks: Record<'current' | 'previous', AIInteraction[]> = {
    current: [],
    previous: [],
  };

  const promptQueues = {
    current: SEED_PROMPTS.filter((p) => p.week === 'current'),
    previous: SEED_PROMPTS.filter((p) => p.week === 'previous'),
  };

  const weekTotal = (p: WeekProfile) => p.volume.reduce((a, b) => a + b, 0);
  const bags: Record<'current' | 'previous', PromptCategory[]> = {
    previous: buildCategoryBag(rng, PREVIOUS_WEEK.mix, weekTotal(PREVIOUS_WEEK)),
    current: buildCategoryBag(rng, CURRENT_WEEK.mix, weekTotal(CURRENT_WEEK)),
  };

  for (let dayOffset = TOTAL_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const key: 'current' | 'previous' = dayOffset < WINDOW_DAYS ? 'current' : 'previous';
    const profile = key === 'current' ? CURRENT_WEEK : PREVIOUS_WEEK;
    const date = dayStart(reference, dayOffset);
    const weekdayIndex = (date.getDay() + 6) % 7; // Monday = 0
    const count = profile.volume[weekdayIndex];

    for (let i = 0; i < count; i += 1) {
      const category = bags[key].pop() ?? 'code-generation';
      const [aMin, aMax] = ASSISTANCE[category];
      const assistanceLevel = randInt(rng, aMin, aMax) as AssistanceLevel;

      const volume = CODE_VOLUME[category];
      const generatedCode = randInt(rng, volume.gen[0], volume.gen[1]);
      const manualCode = randInt(rng, volume.manual[0], volume.manual[1]);
      const userAccepted = generatedCode > 0 ? chance(rng, 0.88) : false;

      // Jitter is drawn here so quota ranking stays deterministic.
      const attemptJitter = rng() * 0.35;
      const followUpJitter = rng() * 0.35;
      const modifyJitter = rng();
      const promptRoll = rng();
      const fallbackLength = randInt(rng, 40, 420);

      const timestamp = new Date(date);
      timestamp.setMinutes(randInt(rng, 9 * 60, 23 * 60));

      const queue = promptQueues[key];
      let promptText: string | undefined;
      const matchIndex = queue.findIndex((p) => p.category === category);
      if (matchIndex >= 0 && promptRoll < 0.55) {
        promptText = queue.splice(matchIndex, 1)[0].text;
      }

      const interaction: AIInteraction & {
        _attempt: number;
        _follow: number;
        _modify: number;
      } = {
        id: `int_${dayOffset}_${i}`,
        timestamp: timestamp.toISOString(),
        tool: pickTool(rng),
        category,
        promptText,
        promptLength: promptText ? promptText.length : fallbackLength,
        assistanceLevel,
        independentlyAttempted: false,
        generatedCode,
        manualCode,
        userAccepted,
        userModified: false,
        followUpAsked: false,
        sessionMinutes: randInt(rng, 3, 26),
        _attempt: ATTEMPT_PROPENSITY[category] + attemptJitter,
        _follow: FOLLOW_UP_PROPENSITY[category] + followUpJitter,
        _modify: modifyJitter,
      };

      all.push(interaction);
      weeks[key].push(interaction);
    }
  }

  // Any prompt the random pass did not place is attached to a free interaction
  // of the right category so nothing in the bank is silently dropped.
  (['current', 'previous'] as const).forEach((key) => {
    promptQueues[key].forEach((seedPrompt) => {
      const target = weeks[key].find(
        (it) => !it.promptText && it.category === seedPrompt.category,
      );
      if (target) {
        target.promptText = seedPrompt.text;
        target.promptLength = seedPrompt.text.length;
      }
    });
  });

  // Apply the exact behavioural rates for each week.
  (['current', 'previous'] as const).forEach((key) => {
    const profile = key === 'current' ? CURRENT_WEEK : PREVIOUS_WEEK;
    const list = weeks[key] as (AIInteraction & {
      _attempt: number;
      _follow: number;
      _modify: number;
    })[];

    assignByQuota(
      list,
      profile.attemptShare,
      (it) => it._attempt,
      (it, value) => {
        it.independentlyAttempted = value;
      },
    );
    assignByQuota(
      list,
      profile.followUpShare,
      (it) => it._follow,
      (it, value) => {
        it.followUpAsked = value;
      },
    );
    assignByQuota(
      list.filter((it) => it.userAccepted),
      profile.modifyShare,
      (it) => it._modify,
      (it, value) => {
        it.userModified = value;
      },
    );
  });

  return all
    .map(({ ...rest }) => {
      const clean = rest as AIInteraction & Record<string, unknown>;
      delete clean._attempt;
      delete clean._follow;
      delete clean._modify;
      return clean as AIInteraction;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function isWithinCurrentWeek(iso: string, reference: Date): boolean {
  return new Date(iso).getTime() >= dayStart(reference, WINDOW_DAYS - 1).getTime();
}

export function splitByWindow(interactions: AIInteraction[], reference: Date) {
  const boundary = dayStart(reference, WINDOW_DAYS - 1).getTime();
  const previousBoundary = dayStart(reference, TOTAL_DAYS - 1).getTime();
  const current: AIInteraction[] = [];
  const previous: AIInteraction[] = [];
  for (const it of interactions) {
    const t = new Date(it.timestamp).getTime();
    if (t >= boundary) current.push(it);
    else if (t >= previousBoundary) previous.push(it);
  }
  return { current, previous };
}
