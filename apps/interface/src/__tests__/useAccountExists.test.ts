import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAccountExists } from "@/hooks/useAccountExists";

// ---------------------------------------------------------------------------
// Mock the Horizon module — we control loadAccount to simulate funded /
// unfunded accounts without hitting the real Stellar testnet.
// ---------------------------------------------------------------------------
const mockLoadAccount = vi.fn();

vi.mock("@stellar/stellar-sdk", () => {
  const MockServer = function (this: { loadAccount: typeof mockLoadAccount }) {
    this.loadAccount = mockLoadAccount;
  };
  return {
    Horizon: {
      Server: MockServer,
    },
  };
});

describe("useAccountExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Normal path — address is null (wallet not connected)
  // -----------------------------------------------------------------------
  it("returns { exists: false, loading: false } when address is null", () => {
    const { result } = renderHook(() => useAccountExists(null));
    expect(result.current.exists).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Normal path — funded account
  // -----------------------------------------------------------------------
  it("returns { exists: true, loading: false } for a funded account", async () => {
    mockLoadAccount.mockResolvedValueOnce({ id: "GXYZ..." });

    const { result } = renderHook(() =>
      useAccountExists("GXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890AB"),
    );

    // While the promise is in-flight, loading should be true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.exists).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Normal path — unfunded (non-existent) account
  // -----------------------------------------------------------------------
  it("returns { exists: false, loading: false } for an unfunded account", async () => {
    mockLoadAccount.mockRejectedValueOnce(new Error("Account not found"));

    const { result } = renderHook(() =>
      useAccountExists("GUNFUNDED1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456"),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.exists).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Loading state — verify the transient loading flag
  // -----------------------------------------------------------------------
  it("shows loading=true while the Horizon request is pending", async () => {
    // Never resolve — keeps loading indefinitely
    mockLoadAccount.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() =>
      useAccountExists("GPENDING123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ012345678"),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.exists).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Address change — re-fetches on new address
  // -----------------------------------------------------------------------
  it("re-fetches when the address changes", async () => {
    // First address: funded
    mockLoadAccount.mockResolvedValueOnce({ id: "GFIRST" });

    const { result, rerender } = renderHook(
      ({ addr }: { addr: string | null }) => useAccountExists(addr),
      { initialProps: { addr: "GFIRST12345678901234567890123456789012345678901234567" } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(true);

    // Second address: unfunded
    mockLoadAccount.mockRejectedValueOnce(new Error("Not found"));

    rerender({ addr: "GSECOND1234567890123456789012345678901234567890123456" });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(false);

    expect(mockLoadAccount).toHaveBeenCalledTimes(2);
  });

  // -----------------------------------------------------------------------
  // Address change to null — resets state immediately
  // -----------------------------------------------------------------------
  it("resets to { exists: false, loading: false } when address becomes null", async () => {
    mockLoadAccount.mockResolvedValueOnce({ id: "GSOME" });

    const { result, rerender } = renderHook(
      ({ addr }: { addr: string | null }) => useAccountExists(addr),
      { initialProps: { addr: "GSOME1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890" as string | null } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(true);

    // Disconnect wallet
    rerender({ addr: null });

    expect(result.current.exists).toBe(false);
    expect(result.current.loading).toBe(false);
    // loadAccount should only have been called once (for the first address)
    expect(mockLoadAccount).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Boundary — empty string address (treated as falsy by the hook)
  // -----------------------------------------------------------------------
  it("treats empty string as no address (returns defaults)", () => {
    const { result } = renderHook(() => useAccountExists("" as unknown as string | null));
    expect(result.current.exists).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(mockLoadAccount).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Cancellation — stale responses from previous address are ignored
  // -----------------------------------------------------------------------
  it("ignores stale responses after address changes (cancellation logic)", async () => {
    // First call: slow resolve
    let resolveFirst!: (v: unknown) => void;
    mockLoadAccount.mockReturnValueOnce(
      new Promise((r) => {
        resolveFirst = r;
      }),
    );
    // Second call: fast resolve (unfunded)
    mockLoadAccount.mockRejectedValueOnce(new Error("Not found"));

    const { result, rerender } = renderHook(
      ({ addr }: { addr: string | null }) => useAccountExists(addr),
      { initialProps: { addr: "GSLOW123456789012345678901234567890123456789012345678" as string | null } },
    );

    // Switch address before the first promise resolves
    rerender({ addr: "GFAST123456789012345678901234567890123456789012345678" });

    await waitFor(() => expect(result.current.loading).toBe(false));
    // Second address is unfunded
    expect(result.current.exists).toBe(false);

    // Now resolve the stale first promise — should NOT flip exists to true
    await act(async () => {
      resolveFirst({ id: "GSLOW" });
    });

    expect(result.current.exists).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Error resilience — network errors are treated as "not exists"
  // -----------------------------------------------------------------------
  it("treats network errors the same as account-not-found", async () => {
    mockLoadAccount.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() =>
      useAccountExists("GNET_ERR123456789012345678901234567890123456789012345"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(false);
  });
});
