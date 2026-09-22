import { Compass } from 'lucide-react';
import { LinkButton } from '@/components/ui/Button';
import { Wordmark } from '@/components/layout/Logo';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 text-center">
      <Wordmark className="mb-8" />
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-raised text-ink-muted">
        <Compass size={19} />
      </div>
      <h1 className="mt-5 text-[20px] font-semibold tracking-[-0.02em] text-ink">
        That screen does not exist
      </h1>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">
        The link you followed points somewhere NiyantraAI does not have a page for.
      </p>
      <div className="mt-6 flex gap-2">
        <LinkButton to="/app" variant="primary">
          Go to dashboard
        </LinkButton>
        <LinkButton to="/" variant="secondary">
          Back to home
        </LinkButton>
      </div>
    </div>
  );
}
