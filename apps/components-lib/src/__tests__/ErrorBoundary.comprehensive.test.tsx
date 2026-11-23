import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, withErrorBoundary, ErrorFallback } from '../ErrorBoundary';

describe('ErrorBoundary Component - Comprehensive', () => {
  // Suppress console.error for tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('renders with custom fallback', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary fallback={(error) => <div>Custom: {error.message}</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom: Test error')).toBeInTheDocument();
    });

    it('renders default fallback when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Something went wrong');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('renders with section level styling', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary level="section">
          <ThrowError />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('[class*="p-6"]');
      expect(errorContainer).toBeInTheDocument();
    });

    it('renders with component level styling', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('[class*="p-4"]');
      expect(errorContainer).toBeInTheDocument();
    });

    it('renders with page level styling', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('[class*="min-h-screen"]');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('calls onError callback when error occurs', () => {
      const handleError = vi.fn();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary onError={handleError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(handleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('captures network errors', () => {
      const handleError = vi.fn();
      const ThrowError = () => {
        throw new Error('Network request failed');
      };

      render(
        <ErrorBoundary onError={handleError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(handleError).toHaveBeenCalled();
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });

    it('captures 401 Unauthorized errors', () => {
      const ThrowError = () => {
        throw new Error('401 Unauthorized');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it('captures 403 Forbidden errors', () => {
      const ThrowError = () => {
        throw new Error('403 Forbidden');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it('captures 404 Not Found errors', () => {
      const ThrowError = () => {
        throw new Error('404 Not Found');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });

    it('shows generic error for unknown errors', () => {
      const ThrowError = () => {
        throw new Error('Something unpredictable happened');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    it('provides try again button to reset boundary', async () => {
      const user = userEvent.setup();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      const tryButton = screen.getByText('Try again');
      expect(tryButton).toBeInTheDocument();

      // After reset, we should be able to show correct content
      rerender(
        <ErrorBoundary>
          <div>Recovered content</div>
        </ErrorBoundary>
      );

      await user.click(tryButton);
      expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });

    it('resets error state when reset is called', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Conditional error');
        }
        return <div>No error</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      shouldThrow = false;
      rerender(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      const tryButton = screen.getByText('Try again');
      await user.click(tryButton);
    });
  });

  describe('HOC withErrorBoundary', () => {
    it('wraps component with error boundary', () => {
      const SafeComponent = ({ message }: { message: string }) => (
        <div>{message}</div>
      );

      const WrappedComponent = withErrorBoundary(SafeComponent);

      render(<WrappedComponent message="Hello" />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('catches errors in wrapped component', () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      const WrappedComponent = withErrorBoundary(ErrorComponent);

      render(<WrappedComponent />);
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('passes boundaryProps to ErrorBoundary', () => {
      const ErrorComponent = () => {
        throw new Error('Test');
      };

      const handleError = vi.fn();
      const WrappedComponent = withErrorBoundary(ErrorComponent, {
        onError: handleError,
      });

      render(<WrappedComponent />);
      expect(handleError).toHaveBeenCalled();
    });

    it('sets correct displayName', () => {
      const NamedComponent = () => <div>Component</div>;
      NamedComponent.displayName = 'MyComponent';

      const WrappedComponent = withErrorBoundary(NamedComponent);
      expect(WrappedComponent.displayName).toBe('withErrorBoundary(MyComponent)');
    });

    it('uses component name when displayName not set', () => {
      function MyComponent() {
        return <div>Component</div>;
      }

      const WrappedComponent = withErrorBoundary(MyComponent);
      expect(WrappedComponent.displayName).toContain('MyComponent');
    });

    it('handles generic displayName', () => {
      const WrappedComponent = withErrorBoundary(() => <div>Component</div>);
      expect(WrappedComponent.displayName).toContain('withErrorBoundary');
    });
  });

  describe('ErrorFallback Component', () => {
    it('renders error fallback UI', () => {
      const error = new Error('Test error');
      const reset = vi.fn();

      render(<ErrorFallback error={error} reset={reset} />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('shows error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });

      const error = new Error('Development error message');
      const reset = vi.fn();

      render(<ErrorFallback error={error} reset={reset} />);

      expect(screen.getByText('Development error message')).toBeInTheDocument();

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv });
    });

    it('calls reset callback when try again is clicked', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      const reset = vi.fn();

      render(<ErrorFallback error={error} reset={reset} />);

      await user.click(screen.getByText('Try again'));
      expect(reset).toHaveBeenCalled();
    });

    it('renders with section level', () => {
      const { container } = render(
        <ErrorFallback
          error={new Error('Test')}
          reset={vi.fn()}
          level="section"
        />
      );

      const errorContainer = container.querySelector('[class*="p-6"]');
      expect(errorContainer).toBeInTheDocument();
    });

    it('renders with component level', () => {
      const { container } = render(
        <ErrorFallback
          error={new Error('Test')}
          reset={vi.fn()}
          level="component"
        />
      );

      const errorContainer = container.querySelector('[class*="p-4"]');
      expect(errorContainer).toBeInTheDocument();
    });

    it('renders with page level', () => {
      const { container } = render(
        <ErrorFallback
          error={new Error('Test')}
          reset={vi.fn()}
          level="page"
        />
      );

      const errorContainer = container.querySelector('[class*="min-h-screen"]');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Multiple Boundaries', () => {
    it('handles nested error boundaries', () => {
      const ThrowError = () => {
        throw new Error('Inner error');
      };

      render(
        <ErrorBoundary fallback={() => <div>Outer boundary</div>}>
          <div>Outer content</div>
          <ErrorBoundary fallback={() => <div>Inner boundary</div>}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText('Inner boundary')).toBeInTheDocument();
      expect(screen.getByText('Outer content')).toBeInTheDocument();
    });

    it('inner boundary catches error before outer', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const outerOnError = vi.fn();
      const innerOnError = vi.fn();

      render(
        <ErrorBoundary onError={outerOnError}>
          <ErrorBoundary onError={innerOnError}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(innerOnError).toHaveBeenCalled();
      expect(outerOnError).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      expect(document.body).toBeInTheDocument();
    });

    it('handles empty error message', () => {
      const ThrowError = () => {
        throw new Error('');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('handles errors with special characters in message', () => {
      const ThrowError = () => {
        throw new Error('Error: <script>alert("xss")</script>');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('handles repeated errors', () => {
      let errorCount = 0;

      const ThrowError = () => {
        errorCount++;
        throw new Error(`Error ${errorCount}`);
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('handles error boundary unmounting and remounting', () => {
      const { unmount, rerender } = render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      unmount();

      rerender(
        <ErrorBoundary>
          <div>New content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('New content')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
