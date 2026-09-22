import { cn } from '@/lib/utils';

/**
 * Deliberately not syntax-highlighted with a heavyweight library: the
 * assessment is about reading code, and a subtle monospace block with line
 * numbers keeps attention on the logic rather than the colours.
 */
export function CodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-hairline bg-[#0a0c10]',
        className,
      )}
    >
      {language ? (
        <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
            {language}
          </span>
        </div>
      ) : null}
      <pre className="overflow-x-auto px-3.5 py-3 text-[12.5px] leading-[1.7]">
        <code className="font-mono text-ink">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span
                aria-hidden
                className="mr-4 w-5 shrink-0 select-none text-right text-ink-faint/60"
              >
                {i + 1}
              </span>
              <span className="min-w-0 whitespace-pre">{line || ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
