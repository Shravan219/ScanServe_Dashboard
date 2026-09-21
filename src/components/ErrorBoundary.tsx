import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[350px] w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0E] p-8 text-center text-white shadow-2xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <AlertTriangle size={28} />
          </div>

          <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
            {this.props.fallbackTitle || 'Component Interrupted'}
          </h2>

          <p className="mt-2 max-w-md text-xs text-white/60 leading-relaxed">
            An unexpected error occurred in this view. The rest of the terminal remains active and your orders are safe.
          </p>

          {this.state.error && (
            <div className="mt-4 max-w-lg rounded-xl border border-white/10 bg-black/60 p-3 text-left font-mono text-[11px] text-amber-300/80 overflow-x-auto max-h-24 custom-scrollbar">
              {(this.state.error as Error).message}
            </div>
          )}

          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black shadow-[0_0_20px_rgba(197,160,89,0.2)] transition-all hover:bg-primary/90 active:scale-95 cursor-pointer touch-manipulation"
          >
            <RotateCcw size={14} />
            <span>Recover View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
