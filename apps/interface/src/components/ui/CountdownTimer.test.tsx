import React from "react";
import { render, screen, act } from "@testing-library/react";
import { CountdownTimer } from "./CountdownTimer";

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders countdown with valid deadline", () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day from now
    render(<CountdownTimer deadline={futureDate.toISOString()} />);
    // Component renders inline format like "1d 0h 0m left"
    expect(screen.getByText(/\d+d/i)).toBeInTheDocument();
  });

  it("shows expired state when deadline passed", () => {
    const pastDate = new Date(Date.now() - 1000);
    render(<CountdownTimer deadline={pastDate.toISOString()} />);
    // Component renders "Campaign Ended" (via t("ended") translation key)
    expect(screen.getByText(/campaign ended/i)).toBeInTheDocument();
  });

  it("updates countdown every second", () => {
    const futureDate = new Date(Date.now() + 3600000); // 1 hour
    const { rerender } = render(<CountdownTimer deadline={futureDate.toISOString()} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    rerender(<CountdownTimer deadline={futureDate.toISOString()} />);
    expect(screen.getByText(/\d+\s*h/)).toBeInTheDocument();
  });

  it("handles deadline in less than 1 minute", () => {
    const soonDate = new Date(Date.now() + 30000); // 30 seconds
    render(<CountdownTimer deadline={soonDate.toISOString()} />);
    expect(screen.getByText(/\d+\s*s/)).toBeInTheDocument();
  });
});
