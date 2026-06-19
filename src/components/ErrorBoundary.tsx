import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorScreen from "./ui/ErrorScreen";

interface Props {
  children: ReactNode;
  fullscreen?: boolean;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          error={this.state.error}
          onRetry={this.reset}
          fullscreen={this.props.fullscreen}
        />
      );
    }
    return this.props.children;
  }

  private reset = () => this.setState({ error: null });
}