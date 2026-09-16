import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { setupApiInterceptor } from './lib/apiConfig';
import { initializeCapacitorAdaptations } from './lib/capacitorSetup';

// Initialize global API proxying for Android & cross-device compatibility
setupApiInterceptor();

// Initialize native Android status bar, tablet wake lock & back-button handling
initializeCapacitorAdaptations();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Dashboard] Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(197,160,89,0.2)]">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#C5A059] tracking-wider mb-2">
            Vyoma ScanServe Dashboard
          </h1>
          <p className="text-white/60 text-sm max-w-md mb-4">
            An unexpected error occurred while rendering the dashboard.
          </p>
          <div className="bg-[#111111] border border-white/10 rounded-xl p-4 max-w-lg w-full text-left font-mono text-xs text-amber-400 mb-6 overflow-x-auto">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-6 py-3 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] active:scale-95 cursor-pointer"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);

