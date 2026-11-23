import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal Component - Comprehensive', () => {
  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
          Content
        </Modal>
      );
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('renders without title', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Test Content Here
        </Modal>
      );
      expect(screen.getByText('Test Content Here')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          footer={<button>Action</button>}
        >
          Content
        </Modal>
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders backdrop element', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('bg-black/50');
    });

    it('renders close button', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;

    sizes.forEach((size) => {
      it(`renders with ${size} size`, () => {
        const { container } = render(
          <Modal isOpen={true} onClose={vi.fn()} size={size}>
            Content
          </Modal>
        );
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      });
    });

    it('applies small size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="sm">
          Content
        </Modal>
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('max-w-sm');
    });

    it('applies medium size class by default', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('max-w-md');
    });

    it('applies large size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="lg">
          Content
        </Modal>
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('applies extra large size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="xl">
          Content
        </Modal>
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass('max-w-xl');
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      await user.click(screen.getByLabelText('Close modal'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      await user.click(backdrop!);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when backdrop is clicked if closeOnBackdropClick is false', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose} closeOnBackdropClick={false}>
          Content
        </Modal>
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      await user.click(backdrop!);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Management', () => {
    it('traps focus within modal', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <button>First Button</button>
          <button>Last Button</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[buttons.length - 2]; // First content button
      const lastButton = buttons[buttons.length - 1]; // Last content button

      firstButton.focus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(lastButton).toHaveFocus();
    });

    it('focuses first focusable element when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[buttons.length - 2]).toHaveFocus();
    });

    it('restores previous focus when modal closes', async () => {
      const { rerender, container } = render(
        <>
          <button>Trigger</button>
          <Modal isOpen={true} onClose={vi.fn()}>
            Content
          </Modal>
        </>
      );

      const triggerButton = screen.getByText('Trigger');
      triggerButton.focus();

      // Close modal and re-render
      rerender(
        <>
          <button>Trigger</button>
          <Modal isOpen={false} onClose={vi.fn()}>
            Content
          </Modal>
        </>
      );

      // Focus should return to trigger
      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });
    });

    it('handles Tab key in focus trap', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      const button1 = buttons[buttons.length - 2];
      const button2 = buttons[buttons.length - 1];

      button1.focus();
      await user.keyboard('{Tab}');
      expect(button2).toHaveFocus();
    });

    it('handles Shift+Tab key in focus trap', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      const button1 = buttons[buttons.length - 2];
      const button2 = buttons[buttons.length - 1];

      button2.focus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(button1).toHaveFocus();
    });
  });

  describe('Body Scroll Lock', () => {
    it('prevents body scroll when modal is open', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal closes', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      );

      await waitFor(() => {
        expect(document.body.style.overflow).not.toBe('hidden');
      });
    });

    it('handles multiple modal toggling', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      );

      rerender(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).not.toBe('hidden');

      rerender(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    it('has dialog role', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('sets aria-modal to true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('links title to dialog with aria-labelledby', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      const title = screen.getByText('Modal Title');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('does not set aria-labelledby when no title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('has proper close button accessibility', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('hides icon from screen readers', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('hides backdrop from screen readers', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const backdrops = container.querySelectorAll('[aria-hidden="true"]');
      let found = false;
      backdrops.forEach((backdrop) => {
        if (backdrop.classList.contains('bg-black/50')) {
          found = true;
        }
      });
      expect(found).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles modal with form', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <form onSubmit={handleSubmit}>
            <input placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      await user.type(screen.getByPlaceholderText('Name'), 'John');
      await user.click(screen.getByText('Submit'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('handles modal with complex footer', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          footer={
            <>
              <button>Cancel</button>
              <button>Confirm</button>
            </>
          }
        >
          Content
        </Modal>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('handles rapid open/close', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <Modal isOpen={i % 2 === 0} onClose={vi.fn()}>
            Content
          </Modal>
        );
      }

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles modal with dynamic content', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Original Content
        </Modal>
      );

      expect(screen.getByText('Original Content')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={vi.fn()}>
          Updated Content
        </Modal>
      );

      expect(screen.getByText('Updated Content')).toBeInTheDocument();
    });

    it('handles conditional focusable elements', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <button>Button 1</button>
          {false && <button>Hidden Button</button>}
          <button>Button 2</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      const button1 = buttons[buttons.length - 2];
      const button2 = buttons[buttons.length - 1];

      button1.focus();
      await user.keyboard('{Tab}');
      expect(button2).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty modal', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          {null}
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles very long title', () => {
      const longTitle =
        'This is a very long modal title that should wrap to multiple lines if necessary';
      render(
        <Modal isOpen={true} onClose={vi.fn()} title={longTitle}>
          Content
        </Modal>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles children without focusable elements', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div>Static content without buttons</div>
        </Modal>
      );
      expect(screen.getByText('Static content without buttons')).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
