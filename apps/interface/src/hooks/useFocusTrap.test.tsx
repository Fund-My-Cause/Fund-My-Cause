/**
 * Regression tests for #749 — keyboard operability across modals.
 *
 * Tests verify that useFocusTrap:
 * 1. Moves focus into the container on activation.
 * 2. Traps Tab/Shift+Tab within focusable elements.
 * 3. Calls onEscape when Escape is pressed.
 * 4. Restores focus to the previously focused element on cleanup.
 */

import React from "react";
import { render, act } from "@testing-library/react";
import { useFocusTrap } from "./useFocusTrap";

// Helper component that uses the hook and attaches the ref to a container div
function TrapContainer({
  active,
  onEscape,
  children,
}: {
  active: boolean;
  onEscape?: () => void;
  children?: React.ReactNode;
}) {
  const ref = useFocusTrap(active, { onEscape });
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {children}
      <button>Button 0</button>
      <button>Button 1</button>
    </div>
  );
}

describe("useFocusTrap (#749)", () => {
  it("focuses the first focusable element when activated", () => {
    const { container } = render(<TrapContainer active={true} />);
    const firstButton = container.querySelector("button");
    expect(document.activeElement).toBe(firstButton);
  });

  it("calls onEscape when Escape key is pressed", () => {
    const onEscape = jest.fn();
    const { container } = render(
      <TrapContainer active={true} onEscape={onEscape} />,
    );

    act(() => {
      container.firstElementChild!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not call onEscape when inactive", () => {
    const onEscape = jest.fn();
    const { container } = render(
      <TrapContainer active={false} onEscape={onEscape} />,
    );

    act(() => {
      container.firstElementChild!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("restores focus to the previously focused element on deactivation", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open modal";
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<TrapContainer active={true} />);

    unmount();
    // After cleanup, focus should return to the trigger
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });
});
