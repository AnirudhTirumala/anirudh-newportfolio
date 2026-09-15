import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * WebGL context creation can fail (old GPUs, browser flags, some privacy
 * modes, headless test runners). The hero reads fine as flat type without
 * its 3D layer, so this boundary swallows that failure instead of taking
 * the rest of the page down with it.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D scene disabled — falling back to flat hero.", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
