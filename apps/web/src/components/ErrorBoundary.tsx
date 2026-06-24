import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
          <div className="card max-w-md w-full p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-muted mb-4">
              The dashboard encountered an unexpected error. Refresh the page to
              try again.
            </p>
            <p className="text-xs font-mono bg-slate-100 rounded-lg p-3 text-left break-all text-slate-700">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark transition"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
