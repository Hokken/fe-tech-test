import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Test component that throws an error when shouldThrow prop is true
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) {
		throw new Error("Test error from component");
	}
	return <div>Component rendered successfully</div>;
};

describe("ErrorBoundary", () => {
	// Suppress console.error for these tests since we're intentionally throwing errors
	const originalConsoleError = console.error;
	beforeEach(() => {
		console.error = vi.fn();
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	it("should render children when no error occurs", () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>
		);

		expect(
			screen.getByText("Component rendered successfully")
		).toBeInTheDocument();
	});

	it("should catch errors and display fallback UI", () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		// Should show error message instead of crashing
		expect(
			screen.getByText("Something went wrong")
		).toBeInTheDocument();
		expect(
			screen.getByText(/An unexpected error occurred/)
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try Again" })
		).toBeInTheDocument();

		// Should not show the original component
		expect(
			screen.queryByText("Component rendered successfully")
		).not.toBeInTheDocument();
	});

	it("should allow retry functionality", () => {
		let shouldThrow = true;
		const TestComponent = () => (
			<ThrowError shouldThrow={shouldThrow} />
		);

		const { rerender } = render(
			<ErrorBoundary>
				<TestComponent />
			</ErrorBoundary>
		);

		// Error state should be visible
		expect(
			screen.getByText("Something went wrong")
		).toBeInTheDocument();

		// Change the error condition
		shouldThrow = false;

		// Click retry button to reset error boundary state
		const retryButton = screen.getByRole("button", {
			name: "Try Again",
		});
		fireEvent.click(retryButton);

		// Re-render with working component after retry
		rerender(
			<ErrorBoundary>
				<TestComponent />
			</ErrorBoundary>
		);

		// Should show successful render after retry
		expect(
			screen.getByText("Component rendered successfully")
		).toBeInTheDocument();
		expect(
			screen.queryByText("Something went wrong")
		).not.toBeInTheDocument();
	});

	it("should display custom fallback UI when provided", () => {
		const customFallback = <div>Custom error message</div>;

		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(
			screen.getByText("Custom error message")
		).toBeInTheDocument();
		expect(
			screen.queryByText("Something went wrong")
		).not.toBeInTheDocument();
	});

	it("should log errors to console", () => {
		const consoleSpy = vi.spyOn(console, "error");

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>
		);

		expect(consoleSpy).toHaveBeenCalledWith(
			"ErrorBoundary caught an error:",
			expect.any(Error),
			expect.any(Object)
		);
	});
});
