import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, type ButtonProps } from '../Button';

describe('Button Component - Comprehensive', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <Button className="custom-class">Button</Button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies fullWidth class when prop is true', () => {
      const { container } = render(<Button fullWidth>Full Width</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('w-full');
    });

    it('renders with forwardRef correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });
  });

  describe('Variants', () => {
    const variants: ButtonProps['variant'][] = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
    ];

    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        const { container } = render(
          <Button variant={variant}>Test</Button>
        );
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        // Check that button has styling applied
        expect(button).toHaveClass('rounded-lg');
      });
    });

    it('applies primary variant styles by default', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-indigo-600', 'text-white');
    });

    it('applies secondary variant styles', () => {
      const { container } = render(<Button variant="secondary">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-gray-200', 'text-gray-900');
    });

    it('applies outline variant styles', () => {
      const { container } = render(<Button variant="outline">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('border-2', 'border-indigo-600');
    });

    it('applies danger variant styles', () => {
      const { container } = render(<Button variant="danger">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-red-600', 'text-white');
    });
  });

  describe('Sizes', () => {
    const sizes: ButtonProps['size'][] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`renders ${size} size correctly`, () => {
        const { container } = render(<Button size={size}>Test</Button>);
        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('applies small size styles', () => {
      const { container } = render(<Button size="sm">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('applies medium size styles by default', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('applies large size styles', () => {
      const { container } = render(<Button size="lg">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
    });

    it('applies disabled styles', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('disables button when loading is true', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('disables button when disabled and loading are true', () => {
      render(
        <Button disabled isLoading>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      const { container } = render(<Button isLoading>Load</Button>);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading text when isLoading is true', () => {
      render(<Button isLoading>Load</Button>);
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
    });

    it('hides loading spinner when isLoading is false', () => {
      const { container } = render(<Button isLoading={false}>Button</Button>);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('shows children when isLoading is false', () => {
      render(<Button isLoading={false}>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('sets aria-busy attribute when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('does not set aria-busy when not loading', () => {
      render(<Button>Not loading</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy');
    });
  });

  describe('User Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Click
        </Button>
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Click
        </Button>
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles focus properly', async () => {
      const user = userEvent.setup();
      render(<Button>Focus Test</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has accessible name from children', () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button', { name: /accessible button/i })).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>);
      expect(screen.getByRole('button', { name: /custom label/i })).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <Button aria-describedby="description">Help</Button>
          <span id="description">Need help?</span>
        </>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('shows focus ring on focus', async () => {
      const user = userEvent.setup();
      const { container } = render(<Button>Focus Ring</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('indicates disabled state to assistive technologies', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards standard HTML attributes', () => {
      const { container } = render(
        <Button data-testid="custom-button" title="Test title">
          Button
        </Button>
      );
      const button = container.querySelector('[data-testid="custom-button"]');
      expect(button).toHaveAttribute('title', 'Test title');
    });

    it('forwards event handlers', async () => {
      const user = userEvent.setup();
      const handleMouseEnter = vi.fn();
      const handleMouseLeave = vi.fn();
      
      render(
        <Button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Events
        </Button>
      );
      
      const button = screen.getByRole('button');
      await user.hover(button);
      expect(handleMouseEnter).toHaveBeenCalled();
      await user.unhover(button);
      expect(handleMouseLeave).toHaveBeenCalled();
    });

    it('supports type attribute', () => {
      const { container } = render(<Button type="submit">Submit</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('supports form attribute', () => {
      const { container } = render(<Button form="myForm">Submit</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('form', 'myForm');
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty children', () => {
      const { container } = render(<Button />);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('renders with complex children', () => {
      render(
        <Button>
          <span>Complex</span>
          <span>Children</span>
        </Button>
      );
      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('handles rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles className override correctly', () => {
      const { container } = render(
        <Button className="override-class">Button</Button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('override-class');
    });

    it('combines all prop combinations', () => {
      render(
        <Button
          variant="danger"
          size="lg"
          isLoading={true}
          fullWidth={true}
          disabled={false}
        >
          Complex Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Display Name', () => {
    it('has correct display name for debugging', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});

// Re-export React for JSX
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
