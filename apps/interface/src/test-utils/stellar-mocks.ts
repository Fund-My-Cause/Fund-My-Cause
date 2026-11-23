type MockOverrides = Record<string, unknown>;

/** Creates a fresh RPC server double with the common Soroban methods mocked. */
export function createMockRpcServer(overrides: MockOverrides = {}) {
  return {
    getAccount: jest.fn(),
    getLatestLedger: jest.fn(),
    simulateTransaction: jest.fn(),
    prepareTransaction: jest.fn(),
    sendTransaction: jest.fn(),
    getTransaction: jest.fn(),
    ...overrides,
  };
}

/** Creates a fresh Horizon server double with commonly used methods mocked. */
export function createMockHorizonServer(overrides: MockOverrides = {}) {
  return {
    loadAccount: jest.fn(),
    fetchBaseFee: jest.fn(),
    submitTransaction: jest.fn(),
    ...overrides,
  };
}
