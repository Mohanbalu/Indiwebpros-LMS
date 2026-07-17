import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

const ThrowError = () => {
  throw new Error("Test error");
};

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback UI on error", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom error")).toBeInTheDocument();
  });

  it("calls onError when error occurs", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  it("resets error state via key prop", () => {
    const { rerender } = render(
      <ErrorBoundary key="boundary-1">
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    rerender(
      <ErrorBoundary key="boundary-2">
        <div>Recovered content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });

  it("handles function fallback with reset callback", () => {
    const FallbackUI = ({ reset }: { reset: () => void }) => (
      <div>
        <span>Error occurred</span>
        <button onClick={reset}>Reset</button>
      </div>
    );

    const { rerender } = render(
      <ErrorBoundary fallback={(_, reset) => <FallbackUI reset={reset} />}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText("Error occurred")).toBeInTheDocument();

    rerender(
      <ErrorBoundary key="reset" fallback={(_, reset) => <FallbackUI reset={reset} />}>
        <div>Recovered</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});
