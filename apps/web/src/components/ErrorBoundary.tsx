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
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="lily-pad max-w-md w-full p-8 text-center">
            <div className="text-5xl mb-4">🐸</div>
            <h1 className="text-xl font-bold text-frog-dark mb-2">
              A frog escaped
            </h1>
            <p className="text-sm text-frog/80 mb-4">
              The dashboard hit an unexpected UI error. The pond is still safe —
              refresh to try again.
            </p>
            <p className="text-xs font-mono bg-pond-deep/40 rounded-lg p-3 text-left break-all">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-frog text-white px-4 py-2 text-sm font-medium hover:bg-frog-dark transition"
            >
              Refresh the pond
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
