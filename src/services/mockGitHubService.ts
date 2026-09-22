import type { RepoAnalysis, RepoModule } from '@/types';
import { createRng, randInt, round } from '@/lib/utils';

/**
 * GitHub integration - SIMULATED.
 *
 * Structured exactly like the real thing so the live version is a drop-in:
 * parse the URL, fetch the tree and language stats, derive modules, return a
 * RepoAnalysis. `source` is carried on the result and surfaced in the UI so a
 * simulated analysis is never presented as a real one.
 *
 * Live implementation (not enabled in the prototype) would call:
 *   GET /repos/{owner}/{repo}
 *   GET /repos/{owner}/{repo}/languages
 *   GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
 *   GET /repos/{owner}/{repo}/commits?per_page=100
 * and needs only an unauthenticated token for public repositories.
 */

export interface ParsedRepo {
  owner: string;
  repo: string;
  normalisedUrl: string;
}

export class RepoUrlError extends Error {}

export function parseRepoUrl(input: string): ParsedRepo {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  if (!trimmed) throw new RepoUrlError('Enter a GitHub repository URL.');

  const match = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/i,
  );
  if (!match) {
    const shorthand = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (shorthand) {
      return {
        owner: shorthand[1],
        repo: shorthand[2],
        normalisedUrl: `https://github.com/${shorthand[1]}/${shorthand[2]}`,
      };
    }
    throw new RepoUrlError(
      'That does not look like a GitHub repository. Try https://github.com/owner/repo',
    );
  }
  return {
    owner: match[1],
    repo: match[2],
    normalisedUrl: `https://github.com/${match[1]}/${match[2]}`,
  };
}

/** Stack detection from the repository name plus the declared stack. */
function detectLanguages(repo: string, stack: string[]): { name: string; share: number }[] {
  const hay = `${repo} ${stack.join(' ')}`.toLowerCase();
  const candidates: { name: string; weight: number }[] = [];

  if (/react|next|frontend|web|dashboard|ui/.test(hay)) candidates.push({ name: 'TypeScript', weight: 46 });
  if (/node|express|api|backend|server/.test(hay)) candidates.push({ name: 'JavaScript', weight: 24 });
  if (/python|ml|ai|data|analy/.test(hay)) candidates.push({ name: 'Python', weight: 38 });
  if (/sql|postgres|database/.test(hay)) candidates.push({ name: 'SQL', weight: 12 });
  if (/docker|infra|deploy/.test(hay)) candidates.push({ name: 'Dockerfile', weight: 6 });

  if (!candidates.length) {
    candidates.push({ name: 'TypeScript', weight: 52 }, { name: 'JavaScript', weight: 28 });
  }
  candidates.push({ name: 'CSS', weight: 9 }, { name: 'Other', weight: 4 });

  const total = candidates.reduce((acc, c) => acc + c.weight, 0);
  return candidates
    .map((c) => ({ name: c.name, share: round((c.weight / total) * 100, 1) }))
    .sort((a, b) => b.share - a.share);
}

function buildModules(rng: () => number, stack: string[]): RepoModule[] {
  const hay = stack.join(' ').toLowerCase();
  const modules: RepoModule[] = [];

  const add = (path: string, role: string, complexityRange: [number, number]) =>
    modules.push({
      path,
      role,
      files: randInt(rng, 4, 26),
      complexity: randInt(rng, complexityRange[0], complexityRange[1]),
      aiAuthoredShare: round(0.3 + rng() * 0.55, 2),
    });

  if (/react|next|typescript|frontend/.test(hay) || !hay) {
    add('src/components', 'Presentation layer and shared UI primitives', [18, 44]);
    add('src/pages', 'Route-level screens and data loading', [22, 52]);
  }
  if (/node|express|backend|api/.test(hay) || !hay) {
    add('server/routes', 'HTTP surface and request validation', [24, 58]);
    add('server/middleware', 'Auth, parsing and error handling pipeline', [16, 38]);
    add('server/services', 'Business logic and external API calls', [34, 72]);
  }
  if (/postgres|sql|database|prisma/.test(hay)) {
    add('server/db', 'Schema, migrations and query helpers', [20, 46]);
  }
  if (/openai|ai|ml|embedding|llm/.test(hay)) {
    add('server/ai', 'Model calls, prompt assembly and retry policy', [30, 66]);
  }
  if (!modules.length) {
    add('src', 'Application source', [20, 50]);
  }
  return modules;
}

function conceptsFor(stack: string[]): string[] {
  const hay = stack.join(' ').toLowerCase();
  const concepts: string[] = [];
  if (/react/.test(hay)) concepts.push('Component render triggers', 'Client-side state ownership');
  if (/express|node/.test(hay)) concepts.push('Middleware ordering', 'Error propagation');
  if (/postgres|sql/.test(hay)) concepts.push('Index selectivity', 'Transaction boundaries');
  if (/openai|ai|llm/.test(hay)) concepts.push('Rate limiting and retries', 'Failure modes of model calls');
  if (/jwt|auth/.test(hay)) concepts.push('Token verification', 'Session revocation');
  if (!concepts.length) concepts.push('Module boundaries', 'Data flow');
  return concepts;
}

export interface AnalyseOptions {
  stack?: string[];
  /** Simulated network latency, ms. */
  delay?: number;
}

export async function analyseRepository(
  url: string,
  options: AnalyseOptions = {},
): Promise<RepoAnalysis> {
  const parsed = parseRepoUrl(url);
  await new Promise((resolve) => setTimeout(resolve, options.delay ?? 1100));

  // Deterministic per repository, so the same URL always analyses the same way.
  const seed = [...`${parsed.owner}/${parsed.repo}`].reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
    7,
  );
  const rng = createRng(seed);
  const stack = options.stack?.length ? options.stack : ['React', 'Node.js', 'PostgreSQL'];
  const modules = buildModules(rng, stack);

  const complexityScore = Math.round(
    modules.reduce((acc, m) => acc + m.complexity, 0) / Math.max(1, modules.length),
  );

  return {
    repoUrl: parsed.normalisedUrl,
    owner: parsed.owner,
    repo: parsed.repo,
    analysedAt: new Date().toISOString(),
    languages: detectLanguages(parsed.repo, stack),
    modules,
    commits: randInt(rng, 60, 420),
    contributors: randInt(rng, 1, 4),
    documentationScore: randInt(rng, 28, 82),
    complexityScore,
    testCoverageSignal: randInt(rng, 5, 64),
    architectureSummary: `${modules.length} top-level modules. The heaviest concentration of complexity sits in ${
      [...modules].sort((a, b) => b.complexity - a.complexity)[0]?.path ?? 'src'
    }, which is also where AI-authored code is densest.`,
    detectedConcepts: conceptsFor(stack),
    source: 'simulated',
  };
}
