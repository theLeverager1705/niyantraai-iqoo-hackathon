/* Dev-only: prints the numbers the engine produces for the demo dataset.
   Run with: npm run calibrate                                            */
import { buildDemoInteractions, splitByWindow } from '../src/data/demoDataset';
import {
  computeAnalytics,
  computeWindowStats,
  aiDependencyScore,
  independentThinkingScore,
  behaviouralUnderstanding,
} from '../src/lib/analyticsEngine';
import { scorePrompt } from '../src/lib/promptAnalyzer';
import { SEED_PROMPTS, CONTRAST_PROMPTS } from '../src/data/promptBank';
import { DEMO_EVIDENCE } from '../src/data/demoProfile';

const ref = new Date('2026-09-22T15:00:00');
const interactions = buildDemoInteractions(ref);
const { current, previous } = splitByWindow(interactions, ref);
const cur = computeWindowStats(current);
const prev = computeWindowStats(previous);

const f = (n: number) => n.toFixed(3);
console.log('interactions total/current/previous:', interactions.length, current.length, previous.length);
console.log(
  'CUR  handover', f(cur.handover),
  'subst', f(cur.substitution),
  'attempt', f(cur.attemptShare),
  'unexam', f(cur.unexamined),
  'authorship', f(cur.authorship),
  'mod', f(cur.modificationRate),
  'follow', f(cur.followUpRate),
  'undSeek', f(cur.understandingSeeking),
  'explShare', f(cur.explanationShare),
);
console.log(
  'PRE  handover', f(prev.handover),
  'subst', f(prev.substitution),
  'attempt', f(prev.attemptShare),
  'unexam', f(prev.unexamined),
  'authorship', f(prev.authorship),
);
console.log('dependency cur/prev:', aiDependencyScore(cur).toFixed(1), aiDependencyScore(prev).toFixed(1));
console.log('independent cur/prev:', independentThinkingScore(cur).toFixed(1), independentThinkingScore(prev).toFixed(1));
console.log('behavUnderstanding cur/prev:', behaviouralUnderstanding(cur).toFixed(1), behaviouralUnderstanding(prev).toFixed(1));
console.log('promptQuality cur/prev:', cur.promptQuality.toFixed(1), prev.promptQuality.toFixed(1), 'analysed', cur.analysedPrompts, prev.analysedPrompts);
console.log('completeSolution cur/prev:', cur.completeSolutionCount, prev.completeSolutionCount, 'independentAttempts', cur.independentCount, prev.independentCount);

const snap = computeAnalytics({ interactions, reference: ref, evidence: DEMO_EVIDENCE });
console.log('--- SNAPSHOT ---');
Object.values(snap.metrics).forEach((m) => console.log(`${m.label}: ${m.value} (delta ${m.delta})`));
console.log('Balance:', snap.balance.value, snap.balance.risk);
console.log('codeSplit', snap.codeSplit);
console.log('daily', snap.daily.map((d) => `${d.label}:${d.aiRequests}/${d.dependency}`).join(' '));
console.log('categories', snap.categories.map((c) => `${c.label}:${c.count}`).join(' '));
console.log('--- PROMPTS ---');
console.log('GOOD example:', scorePrompt(CONTRAST_PROMPTS.good).score);
console.log('RISKY example:', scorePrompt(CONTRAST_PROMPTS.risky).score);
SEED_PROMPTS.forEach((p) => {
  const s = scorePrompt(p.text).score;
  console.log(`  [${p.week === 'current' ? 'C' : 'P'}] ${String(s).padStart(3)}  ${p.text.slice(0, 60)}`);
});
