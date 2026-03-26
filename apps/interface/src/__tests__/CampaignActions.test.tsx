import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CampaignActions } from "@/app/campaigns/[id]/CampaignActions";

// ---------------------------------------------------------------------------
// Mocks — isolate the component from external dependencies
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

vi.mock("@/lib/soroban", () => ({
  fetchContribution: vi.fn().mockResolvedValue(0),
}));

// ---------------------------------------------------------------------------
// Shared props
// ---------------------------------------------------------------------------
const baseProps = {
  contractId: "CCONTRACT1234567890",
  creator: "GCREATOR1234567890",
  deadlinePassed: false,
  goalMet: false,
  campaignTitle: "Test Campaign",
  status: "Active" as const,
};

describe("CampaignActions — unfunded account warning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddress = null;
    mockAccountExists = { exists: false, loading: false };
  });

  // -----------------------------------------------------------------------
  // Normal — no wallet connected: warning hidden
  // -----------------------------------------------------------------------
  it("does NOT show warning when wallet is not connected", () => {
    mockAddress = null;
    mockAccountExists = { exists: false, loading: false };

    render(<CampaignActions {...baseProps} />);

    expect(
      screen.queryByText(/not funded on the Stellar network/),
    ).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Normal — funded account: warning hidden
  // -----------------------------------------------------------------------
  it("does NOT show warning when account is funded", () => {
    mockAddress = "GFUNDED1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
    mockAccountExists = { exists: true, loading: false };

    render(<CampaignActions {...baseProps} />);

    expect(
      screen.queryByText(/not funded on the Stellar network/),
    ).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Normal — unfunded account: warning visible
  // -----------------------------------------------------------------------
  it("shows warning when wallet is connected but account is unfunded", () => {
    mockAddress = "GUNFUNDED12345678901234567890123456789012345678901234";
    mockAccountExists = { exists: false, loading: false };

    render(<CampaignActions {...baseProps} />);

    expect(
      screen.getByText(/Your wallet account is not funded on the Stellar network/),
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Boundary — loading state: warning hidden during check
  // -----------------------------------------------------------------------
  it("does NOT show warning while account existence is loading", () => {
    mockAddress = "GLOADING12345678901234567890123456789012345678901234";
    mockAccountExists = { exists: false, loading: true };

    render(<CampaignActions {...baseProps} />);

    expect(
      screen.queryByText(/not funded on the Stellar network/),
    ).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Campaign not active — warning still shown when unfunded
  // -----------------------------------------------------------------------
  it("shows warning even when campaign status is not Active", () => {
    mockAddress = "GREFUND123456789012345678901234567890123456789012345";
    mockAccountExists = { exists: false, loading: false };

    render(
      <CampaignActions
        {...baseProps}
        status="Refunded"
        deadlinePassed={true}
        goalMet={false}
      />,
    );

    expect(
      screen.getByText(/Your wallet account is not funded on the Stellar network/),
    ).toBeInTheDocument();
  });
});
