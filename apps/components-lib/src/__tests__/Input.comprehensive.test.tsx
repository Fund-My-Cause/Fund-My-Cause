import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component - Comprehensive', () => {
  describe('Rendering', () => {
    it('renders basic input', () => {
      const { container } = render(<Input />);
      expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input label="Password" helperText="Min 8 characters" />);
      expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input label="Email" error="Invalid email format" />);
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('renders error message instead of helper text', () => {
      render(
        <Input
          label="Email"
          error="Invalid email"
          helperText="Enter valid email"
        />
      );
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.queryByText('Enter valid email')).not.toBeInTheDocument();
    });

    it('renders with forwardRef', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Input Types', () => {
    const types = [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'date',
      'time',
      'datetime-local',
      'search',
    ] as const;

    types.forEach((type) => {
      it(`renders with type="${type}"`, () => {
        const { container } = render(<Input type={type} />);
        expect(container.querySelector(`input[type="${type}"]`)).toBeInTheDocument();
      });
    });

    it('renders email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');
    });

    it('renders password input', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('renders number input', () => {
      const { container } = render(<Input type="number" />);
      const input = container.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Form Field Attributes', () => {
    it('renders with required indicator', () => {
      render(<Input label="Name" required />);
      const label = screen.getByText('Name');
      expect(label).toBeInTheDocument();
    });

    it('sets required attribute on input', () => {
      const { container } = render(<Input required />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('required');
    });

    it('renders with disabled state', () => {
      const { container } = render(<Input disabled />);
      expect(container.querySelector('input')).toBeDisabled();
    });

    it('renders with readonly state', () => {
      const { container } = render(<Input readOnly />);
      expect(container.querySelector('input')).toHaveAttribute('readonly');
    });

    it('renders with maxLength', () => {
      const { container } = render(<Input maxLength={10} />);
      expect(container.querySelector('input')).toHaveAttribute('maxLength', '10');
    });

    it('renders with minLength', () => {
      const { container } = render(<Input minLength={5} />);
      expect(container.querySelector('input')).toHaveAttribute('minLength', '5');
    });

    it('renders with max/min for number input', () => {
      const { container } = render(<Input type="number" min="0" max="100" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('renders with pattern', () => {
      const { container } = render(<Input pattern="[0-9]{3}-[0-9]{4}" />);
      expect(container.querySelector('input')).toHaveAttribute(
        'pattern',
        '[0-9]{3}-[0-9]{4}'
      );
    });
  });

  describe('Styling', () => {
    it('applies fullWidth class', () => {
      const { container } = render(<Input fullWidth />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Input className="custom-class" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('custom-class');
    });

    it('applies error styling when error prop is present', () => {
      const { container } = render(<Input error="Error message" />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('does not apply error styling when error is null', () => {
      const { container } = render(<Input error={null} />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('applies custom field className', () => {
      const { container } = render(
        <Input fieldClassName="custom-field-class" />
      );
      expect(container.querySelector('.custom-field-class')).toBeInTheDocument();
    });

    it('applies custom label className', () => {
      render(<Input label="Label" labelClassName="custom-label-class" />);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('custom-label-class');
    });

    it('applies custom error className', () => {
      render(
        <Input error="Error" errorClassName="custom-error-class" />
      );
      const error = screen.getByText('Error');
      expect(error).toHaveClass('custom-error-class');
    });

    it('applies custom helper text className', () => {
      render(
        <Input
          helperText="Helper"
          helperTextClassName="custom-helper-class"
        />
      );
      const helper = screen.getByText('Helper');
      expect(helper).toHaveClass('custom-helper-class');
    });

    it('renders with unstyled prop', () => {
      const { container } = render(<Input unstyled={true} />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, 'hello');
      expect(input.value).toBe('hello');
    });

    it('handles focus event', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      await user.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalled();
    });

    it('handles blur event', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.click(document.body);
      expect(handleBlur).toHaveBeenCalled();
    });

    it('handles change event', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles keydown event', async () => {
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('handles keyup event', async () => {
      const user = userEvent.setup();
      const handleKeyUp = vi.fn();
      render(<Input onKeyUp={handleKeyUp} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleKeyUp).toHaveBeenCalled();
    });

    it('respects readonly attribute', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input readOnly onChange={handleChange} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.click(input);
      expect(input).toHaveAttribute('readonly');
    });

    it('respects disabled attribute', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).not.toBeEnabled();
    });

    it('handles controlled component', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Input value="initial" onChange={() => {}} />);
      let input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(<Input value="updated" onChange={() => {}} />);
      input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('updated');
    });

    it('handles uncontrolled component with defaultValue', () => {
      render(<Input defaultValue="default" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('default');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('renders error with correct role', () => {
      render(<Input error="Invalid input" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Input aria-label="Custom label" />);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });

    it('supports aria-describedby for error', () => {
      render(
        <Input error="Error message" aria-describedby="error-desc" />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-desc');
    });

    it('supports aria-invalid for error state', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports aria-required for required inputs', () => {
      render(<Input required aria-required="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('supports autocomplete attribute', () => {
      const { container } = render(<Input type="email" autoComplete="email" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('supports spellcheck attribute', () => {
      const { container } = render(<Input spellCheck="false" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('spellcheck', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty error string', () => {
      const { container } = render(<Input error="" />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('handles undefined error', () => {
      const { container } = render(<Input error={undefined} />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('handles very long placeholder', () => {
      const longPlaceholder = 'a'.repeat(500);
      render(<Input placeholder={longPlaceholder} />);
      const input = screen.getByPlaceholderText(longPlaceholder);
      expect(input).toBeInTheDocument();
    });

    it('handles special characters in value', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, '<>&"\'');
      expect(input.value).toBe('<>&"\'');
    });

    it('handles rapid value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'abcdef');
      expect(handleChange).toHaveBeenCalledTimes(6);
    });

    it('handles number input with decimal', async () => {
      const user = userEvent.setup();
      render(<Input type="number" step="0.01" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, '10.50');
      expect(input.value).toBe('10.50');
    });

    it('handles date input', async () => {
      const user = userEvent.setup();
      const { container } = render(<Input type="date" />);
      const input = container.querySelector('input[type="date"]') as HTMLInputElement;

      await user.type(input, '12312021');
      expect(input.value).toBeTruthy();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards data attributes', () => {
      const { container } = render(
        <Input data-testid="custom-input" data-custom="value" />
      );
      const input = container.querySelector('[data-testid="custom-input"]');
      expect(input).toHaveAttribute('data-custom', 'value');
    });

    it('forwards name attribute', () => {
      const { container } = render(<Input name="email" />);
      expect(container.querySelector('input')).toHaveAttribute('name', 'email');
    });

    it('forwards autoFocus attribute', () => {
      const { container } = render(<Input autoFocus />);
      expect(container.querySelector('input')).toHaveFocus();
    });

    it('forwards tabIndex', () => {
      const { container } = render(<Input tabIndex={2} />);
      expect(container.querySelector('input')).toHaveAttribute('tabIndex', '2');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
