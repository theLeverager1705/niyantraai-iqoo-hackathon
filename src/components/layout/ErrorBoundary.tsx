import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCw, TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * A crash anywhere in the tree becomes a recoverable screen rather than a
 * white page. For a live demo that matters more than it usually would.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept as a warning so the console stays clean of uncaught errors.
    console.warn('NiyantraAI recovered from a render error:', error.message, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <div className="panel max-w-md p-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(240,97,111,0.3)] bg-risk-soft text-risk">
            <TriangleAlert size={19} />
          </div>
          <h1 className="mt-4 text-[17px] font-semibold text-ink">Something broke</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            {this.state.error.message ||
              'An unexpected error stopped this screen from rendering.'}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.hash = '#/';
              window.location.reload();
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-[#0b0c11] transition-colors hover:bg-[#8e9bff]"
          >
            <RotateCw size={14} />
            Reload NiyantraAI
          </button>
        </div>
      </div>
    );
  }
}
