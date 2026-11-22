import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWallet } from './useWallet';

// Mock the wallet slice hook
const mockAutoRestore = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSignTx = vi.fn();
const mockSetError = vi.fn();

const mockWalletSliceState = {
  address: null as string | null,
  isConnected: false,
  isConnecting: false,
  error: null as string | null,
  network: null as string | null,
  autoRestore: mockAutoRestore,
  connect: mockConnect,
  disconnect: mockDisconnect,
  signTx: mockSignTx,
  setError: mockSetError,
};

vi.mock('@/hooks/useWalletSlice', () => ({
  useWalletSlice: () => mockWalletSliceState,
}));

// Mock the XLM balance hook
const mockUseXlmBalance = vi.fn();
vi.mock('@/hooks/useXlmBalance', () => ({
  useXlmBalance: (...args: unknown[]) => mockUseXlmBalance(...args),
}));

// Mock the Toast component
const mockToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  Toast: (...args: unknown[]) => mockToast(...args),
}));

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletSliceState.address = null;
    mockWalletSliceState.isConnected = false;
    mockWalletSliceState.isConnecting = false;
    mockWalletSliceState.error = null;
    mockWalletSliceState.network = null;
    mockUseXlmBalance.mockReturnValue({
      balance: '0',
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('autoRestore on mount', () => {
    it('calls autoRestore once on mount', () => {
      renderHook(() => useWallet());
      expect(mockAutoRestore).toHaveBeenCalledTimes(1);
    });

    it('does not call autoRestore again on re-render', () => {
      const { rerender } = renderHook(() => useWallet());
      rerender();
      rerender();
      expect(mockAutoRestore).toHaveBeenCalledTimes(1);
    });
  });

  describe('connect', () => {
    it('opens the wallet-select modal when connect is invoked', () => {
      const { result } = renderHook(() => useWallet());
      expect(result.current.isWalletModalOpen).toBe(false);

      act(() => {
        result.current.connect();
      });

      expect(result.current.isWalletModalOpen).toBe(true);
    });

    it('exposes a closeWalletModal callback that closes the modal', () => {
      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.connect();
      });
      expect(result.current.isWalletModalOpen).toBe(true);

      act(() => {
        result.current.closeWalletModal();
      });
      expect(result.current.isWalletModalOpen).toBe(false);
    });

    it('forwards the slice connect action through the returned connectWallet callback', () => {
      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.connectWallet();
      });

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('invokes the slice disconnect action with a toast callback', () => {
      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      const callback = mockDisconnect.mock.calls[0][0];
      expect(typeof callback).toBe('function');

      callback('Disconnected');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Disconnected' }),
      );
    });

    it('invokes the toast callback with default message when none provided', () => {
      const { result } = renderHook(() => useWallet());

      act(() => {
        result.current.disconnect();
      });

      const callback = mockDisconnect.mock.calls[0][0];
      callback();
      expect(mockToast).toHaveBeenCalled();
    });
  });

  describe('signTx', () => {
    it('forwards the XDR and toast callback to the slice signTx action', async () => {
      mockSignTx.mockResolvedValue('signed-xdr');
      const { result } = renderHook(() => useWallet());
      const xdr = 'AAAA-test-xdr';

      let signed: string | undefined;
      await act(async () => {
        signed = await result.current.signTx(xdr);
      });

      expect(mockSignTx).toHaveBeenCalledTimes(1);
      expect(mockSignTx.mock.calls[0][0]).toBe(xdr);
      const callback = mockSignTx.mock.calls[0][1];
      expect(typeof callback).toBe('function');
      expect(signed).toBe('signed-xdr');

      callback('Signed successfully');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Signed successfully' }),
      );
    });

    it('propagates errors thrown by the slice signTx action', async () => {
      const err = new Error('sign failed');
      mockSignTx.mockRejectedValue(err);
      const { result } = renderHook(() => useWallet());

      await expect(
        act(async () => {
          await result.current.signTx('bad-xdr');
        }),
      ).rejects.toThrow('sign failed');
    });
  });

  describe('error and network-mismatch state propagation', () => {
    it('propagates the error state from the slice', () => {
      mockWalletSliceState.error = 'Wallet not found';
      const { result } = renderHook(() => useWallet());
      expect(result.current.error).toBe('Wallet not found');
    });

    it('propagates network mismatch state from the slice', () => {
      mockWalletSliceState.network = 'PUBLIC';
      mockWalletSliceState.error = 'Network mismatch: expected TESTNET';
      const { result } = renderHook(() => useWallet());
      expect(result.current.network).toBe('PUBLIC');
      expect(result.current.error).toBe('Network mismatch: expected TESTNET');
    });

    it('exposes setError from the slice', () => {
      const { result } = renderHook(() => useWallet());
      act(() => {
        result.current.setError('boom');
      });
      expect(mockSetError).toHaveBeenCalledWith('boom');
    });
  });

  describe('memoised return shape and callback stability', () => {
    it('returns the expected shape', () => {
      const { result } = renderHook(() => useWallet());
      expect(result.current).toEqual(
        expect.objectContaining({
          address: null,
          isConnected: false,
          isConnecting: false,
          error: null,
          network: null,
          isWalletModalOpen: false,
          connect: expect.any(Function),
          connectWallet: expect.any(Function),
          closeWalletModal: expect.any(Function),
          disconnect: expect.any(Function),
          signTx: expect.any(Function),
          setError: expect.any(Function),
        }),
      );
    });

    it('keeps callbacks stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useWallet());
      const first = {
        connect: result.current.connect,
        connectWallet: result.current.connectWallet,
        closeWalletModal: result.current.closeWalletModal,
        disconnect: result.current.disconnect,
        signTx: result.current.signTx,
        setError: result.current.setError,
      };

      rerender();

      expect(result.current.connect).toBe(first.connect);
      expect(result.current.connectWallet).toBe(first.connectWallet);
      expect(result.current.closeWalletModal).toBe(first.closeWalletModal);
      expect(result.current.disconnect).toBe(first.disconnect);
      expect(result.current.signTx).toBe(first.signTx);
      expect(result.current.setError).toBe(first.setError);
    });
  });
});