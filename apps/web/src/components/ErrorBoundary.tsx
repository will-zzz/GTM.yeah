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
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
          <div className="card max-w-md w-full p-6 text-center">
            <h1 className="text-base font-semibold text-zinc-900 mb-1">
              Something went wrong
            </h1>
            <p className="text-xs text-zinc-500 mb-3">
              The dashboard encountered an unexpected error. Refresh the page to
              try again.
            </p>
            <p className="text-[11px] font-mono bg-zinc-100 border border-zinc-200 rounded-sm p-2 text-left break-all text-zinc-700">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-sm bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-dark transition"
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
