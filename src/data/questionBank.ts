import type { Question } from '@/types';

/**
 * Question bank for the baseline, project-understanding and adaptive
 * assessments.
 *
 * Free-text answers are scored on concept coverage (see lib/answerEvaluator),
 * so `expectedConcepts` entries list acceptable phrasings separated by "|".
 * `tags` let the adaptive engine prefer questions about the stack the
 * developer actually used.
 */

export const BASELINE_QUESTIONS: Question[] = [
  {
    id: 'q_b1',
    kind: 'code-comprehension',
    difficulty: 'foundational',
    dimension: 'code-reading',
    prompt: 'What does this function return when called with [3, 1, 4, 1, 5]?',
    language: 'javascript',
    code: `function mystery(items) {
  return items.reduce((acc, n) => {
    if (!acc.includes(n)) acc.push(n);
    return acc;
  }, []);
}`,
    options: [
      { id: 'a', label: '[3, 1, 4, 5] — duplicates removed, order preserved' },
      { id: 'b', label: '[1, 1, 3, 4, 5] — sorted ascending' },
      { id: 'c', label: '[5, 1, 4, 1, 3] — reversed' },
      { id: 'd', label: '14 — the sum of the items' },
    ],
    correctOptionId: 'a',
    modelAnswer:
      'The reducer pushes a value only when it is not already in the accumulator, so it de-duplicates while preserving first-seen order.',
    tags: ['javascript', 'fundamentals'],
  },
  {
    id: 'q_b2',
    kind: 'debugging',
    difficulty: 'foundational',
    dimension: 'debugging',
    prompt:
      'This endpoint always responds before the database call finishes. Explain in your own words why, and what you would change.',
    language: 'javascript',
    code: `app.get('/resumes/:id', (req, res) => {
  let resume;
  db.findResume(req.params.id).then((row) => {
    resume = row;
  });
  res.json(resume);
});`,
    expectedConcepts: [
      'asynchronous|async|promise|not waiting',
      'res.json runs before|executes first|runs immediately|before the promise resolves',
      'await|move into then|send inside the callback|return the promise',
      'undefined',
    ],
    misconceptions: ['db is too slow|database is slow|need a faster database'],
    modelAnswer:
      'db.findResume returns a promise. res.json(resume) runs synchronously on the same tick, before the .then callback assigns resume, so it serialises undefined. The response must be sent inside the .then callback or the handler must await the promise.',
    tags: ['node', 'async'],
  },
  {
    id: 'q_b3',
    kind: 'multiple-choice',
    difficulty: 'intermediate',
    dimension: 'technical-understanding',
    prompt:
      'A table has 400,000 rows and a B-tree index on (status). A query filters on status = "active" which matches 380,000 rows. What is the most likely plan?',
    options: [
      { id: 'a', label: 'Index scan — the index always wins when it exists' },
      { id: 'b', label: 'Sequential scan — the index is not selective enough to be worth it' },
      { id: 'c', label: 'The query fails because the index is the wrong type' },
      { id: 'd', label: 'Bitmap-only scan that never touches the heap' },
    ],
    correctOptionId: 'b',
    modelAnswer:
      'An index that matches 95% of rows costs more than reading the table directly, because each match still requires a heap lookup. Planners fall back to a sequential scan when selectivity is poor.',
    tags: ['database', 'postgres'],
  },
  {
    id: 'q_b4',
    kind: 'short-answer',
    difficulty: 'intermediate',
    dimension: 'problem-solving',
    prompt:
      'You need to find whether a value exists in a sorted array of one million numbers. Describe your approach and why it beats scanning every element.',
    expectedConcepts: [
      'binary search|halve|divide',
      'sorted|ordered',
      'logarithmic|log n|o(log n)|20 steps',
      'compare middle|midpoint|middle element',
    ],
    misconceptions: ['hash map would be faster on a sorted array without extra memory'],
    modelAnswer:
      'Binary search: compare the middle element, discard the half that cannot contain the target, repeat. Because the array is sorted, each comparison halves the search space, giving O(log n) — about 20 comparisons for a million elements instead of up to a million.',
    tags: ['algorithms'],
  },
  {
    id: 'q_b5',
    kind: 'architecture',
    difficulty: 'intermediate',
    dimension: 'architecture',
    prompt:
      'Your app calls a third-party AI API on every page load. Traffic grows 10x and the API starts rate-limiting you. Which part of your system fails first, and what would you change?',
    expectedConcepts: [
      'rate limit|429|throttl',
      'cache|caching|memoise|store the result',
      'queue|background job|async processing|worker',
      'degrade|fallback|graceful',
    ],
    modelAnswer:
      'The request path fails first: every user-facing render is now blocked on a rate-limited dependency. Fixes are caching identical requests, moving the call off the request path into a queue or background worker, and defining a fallback so a 429 degrades the page instead of breaking it.',
    tags: ['architecture', 'ai-ml'],
  },
  {
    id: 'q_b6',
    kind: 'code-comprehension',
    difficulty: 'intermediate',
    dimension: 'code-reading',
    prompt: 'Why does this React component re-render on every keystroke, even for rows that did not change?',
    language: 'tsx',
    code: `function Results({ query, rows }) {
  const filtered = rows.filter((r) => r.name.includes(query));
  const handler = () => console.log('clicked');
  return filtered.map((r) => <Row key={r.id} row={r} onPick={handler} />);
}`,
    expectedConcepts: [
      'new array|new reference|recreated each render|new object identity',
      'handler is recreated|new function|referential equality',
      'memo|usememo|usecallback',
      'props change|prop identity',
    ],
    misconceptions: ['react always re-renders everything so nothing can be done'],
    modelAnswer:
      'filtered and handler are re-created on every render, so each Row receives props that are new by reference even when the underlying data is identical. Memoising the filtered list and the callback gives Row stable props, which lets React.memo skip those subtrees.',
    tags: ['react', 'frontend'],
  },
  {
    id: 'q_b7',
    kind: 'multiple-choice',
    difficulty: 'foundational',
    dimension: 'conceptual',
    prompt:
      'What is the practical difference between a JWT stored in localStorage and a session id in an httpOnly cookie?',
    options: [
      {
        id: 'a',
        label: 'The JWT is readable by any script on the page; the httpOnly cookie is not',
      },
      { id: 'b', label: 'They are equivalent — both are just strings' },
      { id: 'c', label: 'Only the cookie can be used for authentication' },
      { id: 'd', label: 'The JWT cannot be stolen because it is signed' },
    ],
    correctOptionId: 'a',
    modelAnswer:
      'Signing proves the token was not altered; it does nothing to stop it being read. A token in localStorage is reachable by any injected script, while httpOnly cookies are not exposed to JavaScript at all.',
    tags: ['security', 'auth'],
  },
  {
    id: 'q_b8',
    kind: 'short-answer',
    difficulty: 'advanced',
    dimension: 'architecture',
    prompt:
      'Your API is fast in development and slow in production with the same data volume. List the first three things you would measure, and say why each one is worth measuring before you change any code.',
    expectedConcepts: [
      'latency|response time|timing|profil',
      'database quer|n+1|slow quer|query plan',
      'network|round trip|region|distance',
      'measure before changing|evidence|reproduce|isolate',
    ],
    misconceptions: ['add more servers first|scale up immediately'],
    modelAnswer:
      'Measure end-to-end request timing to find which layer owns the latency; inspect query counts and plans for N+1 or missing-index behaviour; check network topology and payload sizes. Each isolates a different suspect, and measuring first prevents optimising a layer that was never the bottleneck.',
    tags: ['backend', 'performance'],
  },
];

export const PROJECT_QUESTIONS: Question[] = [
  {
    id: 'q_p1',
    kind: 'architecture',
    difficulty: 'intermediate',
    dimension: 'architecture',
    prompt:
      'What happens between the moment a user submits the login form and the moment authentication succeeds? Trace it in your own words.',
    context: 'Architecture — request lifecycle',
    expectedConcepts: [
      'request|post|http|submit',
      'validate|check credentials|compare password|hash',
      'database|lookup|find user|query',
      'token|jwt|session|cookie',
      'response|redirect|store the token',
    ],
    misconceptions: ['the password is stored in plain text and compared directly'],
    modelAnswer:
      'The form POSTs credentials; the route validates the payload, looks the user up, compares the submitted password against the stored hash, and on success issues a signed token or session which the client stores and attaches to later requests.',
    tags: ['auth', 'backend', 'architecture'],
  },
  {
    id: 'q_p2',
    kind: 'architecture',
    difficulty: 'advanced',
    dimension: 'conceptual',
    prompt:
      'Why did you choose JWT instead of server-side sessions for this project? Give the trade-off you accepted, not just the benefit.',
    context: 'Architecture — authentication strategy',
    expectedConcepts: [
      'stateless|no server storage|no session store|scales horizontally',
      'revoke|revocation|cannot invalidate|logout is hard',
      'expiry|short lived|refresh token',
      'size|payload|sent on every request',
    ],
    misconceptions: ['jwt is more secure than sessions'],
    modelAnswer:
      'JWTs remove the shared session store, which makes horizontal scaling simpler. The trade-off is revocation: a valid token stays valid until it expires, so logout and compromise handling need short expiry plus a refresh flow or a deny-list.',
    tags: ['auth', 'architecture'],
  },
  {
    id: 'q_p3',
    kind: 'architecture',
    difficulty: 'intermediate',
    dimension: 'architecture',
    prompt:
      'If the database becomes unavailable, which part of your application fails first, and what does the user actually see?',
    context: 'Architecture — failure modes',
    expectedConcepts: [
      'connection|pool|timeout',
      'read path|queries fail|api returns error|500',
      'user sees|error page|blank|spinner',
      'health check|retry|fallback|cache',
    ],
    modelAnswer:
      'The connection pool is the first thing to fail, so any route that queries on the request path starts returning 500s or hanging until the timeout. Without a fallback the user sees an indefinite spinner rather than a useful error, which is why timeouts and a degraded read path matter.',
    tags: ['backend', 'database', 'architecture'],
  },
  {
    id: 'q_p4',
    kind: 'short-answer',
    difficulty: 'intermediate',
    dimension: 'technical-understanding',
    prompt:
      'Why does your backend run middleware before the request reaches the resume controller? Explain what the middleware does with control afterwards.',
    context: 'Backend — middleware pipeline',
    expectedConcepts: [
      'authentication|auth|verify token|identify user',
      'validation|parse|body parser|sanitise',
      'next|passes control|calls the next handler|pipeline',
      'cross cutting|shared|every route|centralise',
    ],
    misconceptions: ['middleware runs after the controller'],
    modelAnswer:
      'Middleware centralises the concerns every route needs — parsing, authentication, validation, logging — so the controller can assume a valid, authenticated request. Each middleware either ends the response or calls next(), which hands control to the following handler in the stack.',
    tags: ['express', 'backend'],
  },
  {
    id: 'q_p5',
    kind: 'code-comprehension',
    difficulty: 'intermediate',
    dimension: 'code-reading',
    prompt: 'Explain this function in your own words. What is it protecting against?',
    context: 'AI integration — resilience',
    language: 'typescript',
    code: `async function callModel(input: string, attempt = 0): Promise<string> {
  try {
    return await openai.complete(input);
  } catch (err) {
    if (attempt >= 4 || err.status !== 429) throw err;
    await sleep(2 ** attempt * 250 + Math.random() * 200);
    return callModel(input, attempt + 1);
  }
}`,
    expectedConcepts: [
      'retry|retries|try again',
      'exponential backoff|doubling|2 \\*\\* attempt|backs off',
      'rate limit|429|throttl',
      'jitter|random|thundering herd|stagger',
      'rethrow|gives up|max attempts|stops after',
    ],
    misconceptions: ['it retries every error|it retries forever'],
    modelAnswer:
      'It retries only rate-limit (429) responses, waiting twice as long after each attempt and adding random jitter so many clients do not retry in lockstep. Any other error, or a fifth attempt, is rethrown rather than swallowed.',
    tags: ['ai-ml', 'node'],
  },
  {
    id: 'q_p6',
    kind: 'debugging',
    difficulty: 'advanced',
    dimension: 'debugging',
    prompt:
      'Your match query does a sequential scan despite an index on (user_id, created_at). The query filters on created_at only. Why is the index not used?',
    context: 'Database — index design',
    expectedConcepts: [
      'leftmost|prefix|first column|column order',
      'user_id is not in the where|filter does not include the first column',
      'separate index|reorder|index on created_at',
      'composite|multi column',
    ],
    misconceptions: ['the index is corrupt|statistics are always the cause'],
    modelAnswer:
      'A composite B-tree index is ordered by its leading column. A filter that does not constrain user_id cannot use the index as a range, so the planner falls back to a sequential scan. Either add an index led by created_at or include user_id in the predicate.',
    tags: ['database', 'postgres', 'performance'],
  },
  {
    id: 'q_p7',
    kind: 'short-answer',
    difficulty: 'advanced',
    dimension: 'conceptual',
    prompt:
      'You used JWT authentication in this project. What security problem occurs if the signing secret is compromised, and what limits the damage?',
    context: 'Security — key compromise',
    expectedConcepts: [
      'forge|mint|sign their own|create valid tokens',
      'impersonate|any user|arbitrary claims|admin',
      'rotate|rotation|new secret|invalidate',
      'short expiry|refresh token|key id|kid',
    ],
    misconceptions: ['https alone prevents this|the token is encrypted so it is safe'],
    modelAnswer:
      'Anyone with the secret can mint tokens with arbitrary claims and impersonate any user, including elevated roles, without ever touching your database. Damage is limited by short expiry, secret rotation with a key id so old tokens stop verifying, and server-side checks for sensitive actions.',
    tags: ['auth', 'security'],
  },
  {
    id: 'q_p8',
    kind: 'short-answer',
    difficulty: 'intermediate',
    dimension: 'technical-understanding',
    prompt:
      'Your resume parser stores embeddings in Postgres. What actually gets compared when a user searches, and why is that different from a keyword search?',
    context: 'AI integration — retrieval',
    expectedConcepts: [
      'vector|embedding|numbers|array of floats',
      'similarity|cosine|distance|nearest',
      'meaning|semantic|related concepts|synonym',
      'keyword|exact match|literal|token overlap',
    ],
    modelAnswer:
      'The query is embedded into the same vector space and compared by distance (cosine or inner product) against stored vectors. That ranks by semantic proximity, so "ML engineer" can match "machine learning" — something exact keyword matching cannot do.',
    tags: ['ai-ml', 'database'],
  },
  {
    id: 'q_p9',
    kind: 'multiple-choice',
    difficulty: 'intermediate',
    dimension: 'technical-understanding',
    prompt:
      'Your Express error-handling middleware is registered before the routes. What happens when a route throws?',
    context: 'Backend — error handling',
    options: [
      { id: 'a', label: 'It still catches the error — order does not matter for error handlers' },
      {
        id: 'b',
        label: 'It never runs; the default handler responds instead, leaking the stack trace',
      },
      { id: 'c', label: 'The process crashes immediately' },
      { id: 'd', label: 'The request hangs forever with no response' },
    ],
    correctOptionId: 'b',
    modelAnswer:
      'Express walks the stack in registration order, so an error handler registered before the routes is already behind the cursor when the error is raised. Express falls back to its default handler, which in development echoes the stack trace.',
    tags: ['express', 'backend'],
  },
  {
    id: 'q_p10',
    kind: 'architecture',
    difficulty: 'advanced',
    dimension: 'architecture',
    prompt:
      'A user uploads a 40-page PDF and the request times out. Redesign that flow. What moves, and what does the user see while it happens?',
    context: 'Architecture — long-running work',
    expectedConcepts: [
      'background|queue|worker|job',
      'accept immediately|202|return a job id|acknowledge',
      'poll|websocket|status endpoint|progress',
      'timeout|request path|synchronous',
    ],
    modelAnswer:
      'Parsing moves off the request path into a queued job. The upload endpoint stores the file, enqueues the work and returns a job id immediately, and the client polls a status endpoint or subscribes to updates so the user sees progress instead of a dead request.',
    tags: ['architecture', 'backend'],
  },
];

export const ADVANCED_QUESTIONS: Question[] = [
  {
    id: 'q_a1',
    kind: 'short-answer',
    difficulty: 'advanced',
    dimension: 'problem-solving',
    prompt:
      'Two users submit the same "apply to job" action at the same moment and the row is written twice. Explain how this happens at the database level and one way to make it impossible.',
    expectedConcepts: [
      'race condition|concurrent|simultaneous|interleav',
      'check then write|read before write|time of check',
      'unique constraint|unique index|primary key',
      'transaction|lock|serializable|upsert',
    ],
    modelAnswer:
      'Both requests read "no existing row", then both insert: the check and the write are not atomic. A unique constraint on (user_id, job_id) makes the second insert fail at the database, which is the only place that can enforce it reliably.',
    tags: ['database', 'concurrency'],
  },
  {
    id: 'q_a2',
    kind: 'debugging',
    difficulty: 'advanced',
    dimension: 'debugging',
    prompt:
      'Memory grows steadily in your Node service and never comes back down between deploys. Describe how you would confirm it is a leak rather than normal caching.',
    expectedConcepts: [
      'heap snapshot|heap profile|memory profil',
      'compare|two snapshots|growth between|retained',
      'gc|garbage collect|not released|retained size',
      'baseline|steady state|load test|reproduce',
    ],
    modelAnswer:
      'Take heap snapshots at a steady state and after sustained load, force a collection between them, and compare retained sizes. A cache plateaus; a leak keeps growing and shows a retainer path holding objects that should be unreachable.',
    tags: ['node', 'performance'],
  },
  {
    id: 'q_a3',
    kind: 'multiple-choice',
    difficulty: 'advanced',
    dimension: 'conceptual',
    prompt:
      'You add an index to speed up reads on a write-heavy table. What is the cost you have accepted?',
    options: [
      { id: 'a', label: 'Every insert and update must also maintain the index' },
      { id: 'b', label: 'Reads become slower because the planner has more options' },
      { id: 'c', label: 'The table can no longer be altered' },
      { id: 'd', label: 'There is no cost — indexes are free' },
    ],
    correctOptionId: 'a',
    modelAnswer:
      'Indexes are additional structures that must be kept consistent on every write, costing write throughput and disk. On a write-heavy table that trade can outweigh the read benefit.',
    tags: ['database'],
  },
  {
    id: 'q_a4',
    kind: 'architecture',
    difficulty: 'advanced',
    dimension: 'architecture',
    prompt:
      'Your AI feature costs more per user than the subscription earns. Without removing the feature, what are your levers?',
    expectedConcepts: [
      'cache|reuse|deduplicate|memoise',
      'smaller model|cheaper model|route by difficulty|tiered',
      'limit|quota|rate limit|budget',
      'batch|shorter prompt|fewer tokens|truncate context',
    ],
    modelAnswer:
      'Cache and deduplicate repeated requests, route easy cases to a cheaper model and reserve the expensive one for hard ones, trim prompt and context size, batch where latency allows, and cap per-user usage with a visible quota.',
    tags: ['ai-ml', 'architecture'],
  },
  {
    id: 'q_a5',
    kind: 'code-comprehension',
    difficulty: 'advanced',
    dimension: 'code-reading',
    prompt: 'What bug does this cache have, and when does it surface?',
    language: 'typescript',
    code: `const cache = new Map<string, Promise<Result>>();

export function getResult(key: string) {
  if (!cache.has(key)) {
    cache.set(key, fetchResult(key));
  }
  return cache.get(key)!;
}`,
    expectedConcepts: [
      'rejected|rejection|failure is cached|error is cached',
      'never retried|permanently|stuck|forever',
      'delete on failure|catch|evict|remove the entry',
      'unbounded|grows forever|no eviction',
    ],
    modelAnswer:
      'A rejected promise stays in the map, so one transient failure is cached permanently and every later caller gets the same rejection. The entry must be deleted in a catch. The map is also unbounded, so it grows for the life of the process.',
    tags: ['typescript', 'node'],
  },
  {
    id: 'q_a6',
    kind: 'short-answer',
    difficulty: 'foundational',
    dimension: 'conceptual',
    prompt:
      'In one or two sentences: what does an HTTP status code in the 4xx range tell you that a 5xx does not?',
    expectedConcepts: [
      'client|caller|request was wrong|sender',
      'server|our side|our fault|backend failure',
      'retry|retrying will not help|same result',
    ],
    modelAnswer:
      '4xx says the request itself was unacceptable, so repeating it unchanged will fail again; 5xx says the server failed to handle an otherwise valid request, which is often worth retrying.',
    tags: ['fundamentals', 'http'],
  },
  {
    id: 'q_a7',
    kind: 'debugging',
    difficulty: 'foundational',
    dimension: 'debugging',
    prompt: 'This loop never terminates for some inputs. Which ones, and why?',
    language: 'javascript',
    code: `function countdown(n) {
  while (n !== 0) {
    console.log(n);
    n -= 2;
  }
}`,
    expectedConcepts: [
      'odd|odd numbers|not even',
      'skips zero|never equals zero|passes over',
      'negative|goes negative|decreases forever',
      'use <= 0|change the condition|n > 0',
    ],
    modelAnswer:
      'Odd inputs never hit exactly 0 because n decreases by two, so the strict inequality is never satisfied and n runs negative forever. Using n > 0 terminates for every input.',
    tags: ['fundamentals', 'javascript'],
  },
  {
    id: 'q_a8',
    kind: 'short-answer',
    difficulty: 'intermediate',
    dimension: 'problem-solving',
    prompt:
      'You inherit a function you did not write and cannot explain. Describe the first three things you would do to build a real model of it — without asking an assistant to summarise it.',
    expectedConcepts: [
      'read the call sites|who calls it|usage|callers',
      'run it|trace|log|debugger|breakpoint',
      'inputs and outputs|examples|test|edge cases',
      'rename|write a test|small change|verify assumption',
    ],
    modelAnswer:
      'Find the call sites to learn what it is expected to do, run it on real inputs with logging or a debugger to watch actual behaviour, then write a test that encodes your current belief. If the test passes, your model is right; if it fails, you learned exactly where you were wrong.',
    tags: ['fundamentals', 'learning'],
  },
];

export const ALL_QUESTIONS: Question[] = [
  ...BASELINE_QUESTIONS,
  ...PROJECT_QUESTIONS,
  ...ADVANCED_QUESTIONS,
];

export function getQuestion(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}
