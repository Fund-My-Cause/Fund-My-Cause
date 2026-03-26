import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PledgeModal } from "@/components/ui/PledgeModal";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockConnect = vi.fn();
let mockAddress: string | null = null;

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    address: mockAddress,
    connect: mockConnect,
  }),
}));

let mockAccountExists = { exists: false, loading: false };

vi.mock("@/hooks/useAccountExists", () => ({
  useAccountExists: () => mockAccountExists,
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// Stub lucide-react X icon to avoid rendering issues in jsdom
vi.mock("lucide-react", () => ({
  X: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "x-icon", ...props }),
  Loader2: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "loader-icon", ...props }),
  CheckCircle: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "check-icon", ...props }),
  XCircle: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "xcircle-icon", ...props }),
  CircleDot: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "circledot-icon", ...props }),
  FileSignature: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "filesig-icon", ...props }),
  Send: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "send-icon", ...props }),
  Clock: (props: Record<string, unknown>) =>
    React.createElement("svg", { "data-testid": "clock-icon", ...props }),
}));

const baseProps = {
  campaignTitle: "Test Campaign",
  onClose: vi.fn(),
};

describe("PledgeModal — unfunded account warning & button disable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddress = null;
    mockAccountExists = { exists: false, loading: false };
  });

  // -----------------------------------------------------------------------
  // Normal — no wallet: no warning, button says "Connect Wallet to Pledge"
  // -----------------------------------------------------------------------
  it("does NOT show warning when wallet is not connected", () => {
    mockAddress = null;
    mockAccountExists = { exists: false, loading: false };

    render(<PledgeModal {...baseProps} />);

    expect(
      screen.queryByText(/not funded on the Stellar network/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Connect Wallet to Pledge")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Normal — funded account: no warning, button enabled
  // -----------------------------------------------------------------------
  it("does NOT show warning and enables button when account is funded", () => {
    mockAddress = "GFUNDED1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
    mockAccountExists = { exists: true, loading: false };

    render(<PledgeModal {...baseProps} />);

    expect(
      screen.queryByText(/not funded on the Stellar network/),
    ).not.toBeInTheDocument();

    const button = screen.getByText("Confirm Pledge");
    expect(button).not.toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Normal — unfunded account: warning visible, button disabled
  // -----------------------------------------------------------------------
  it("shows warning and disables pledge button when account is unfunded", () => {
    mockAddress = "GUNFUNDED12345678901234567890123456789012345678901234";
    mockAccountExists = { exists: false, loading: false };

    render(<PledgeModal {...baseProps} />);

    expect(
      screen.getByText(/not funded on the Stellar network.*Transactions will fail/),
    ).toBeInTheDocument();

    const button = screen.getByText("Confirm Pledge");
    expect(button).toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Boundary — loading state: no warning, button NOT disabled by unfunded
  // -----------------------------------------------------------------------
  it("does NOT show warning or disable button while loading", () => {
    mockAddress = "GLOADING12345678901234567890123456789012345678901234";
    mockAccountExists = { exists: false, loading: true };

    render(<PledgeModal {...baseProps} />);

    expect(
      screen.queryByText(/not funded on the Stellar network/),
    ).not.toBeInTheDocument();

    const button = screen.getByText("Confirm Pledge");
    expect(button).not.toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Boundary — funded → button is explicitly NOT disabled
  // -----------------------------------------------------------------------
  it("keeps pledge button enabled for funded accounts regardless of other state", () => {
    mockAddress = "GACTIVE12345678901234567890123456789012345678901234AB";
    mockAccountExists = { exists: true, loading: false };

    render(<PledgeModal {...baseProps} />);

    const button = screen.getByText("Confirm Pledge");
    expect(button).not.toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Warning text content verification
  // -----------------------------------------------------------------------
  it("displays the correct warning text mentioning minimum XLM balance", () => {
    mockAddress = "GWARNTXT1234567890123456789012345678901234567890123";
    mockAccountExists = { exists: false, loading: false };

    render(<PledgeModal {...baseProps} />);

    const warning = screen.getByText(/minimum XLM balance/);
    expect(warning).toBeInTheDocument();
  });
});
