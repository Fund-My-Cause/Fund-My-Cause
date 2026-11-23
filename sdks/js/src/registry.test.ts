import { FmcRegistryClient } from "./registry";

const mockSimulateTransaction = jest.fn();

jest.mock("@stellar/stellar-sdk", () => {
  const actual = jest.requireActual("@stellar/stellar-sdk");
  return {
    ...actual,
    rpc: {
      Server: jest.fn().mockImplementation(() => ({
        simulateTransaction: mockSimulateTransaction,
      })),
      Api: {
        isSimulationError: (result: any) => Boolean(result?.error),
      },
    },
    Contract: jest.fn().mockImplementation((contractId: string) => ({
      contractId,
      call: jest.fn().mockReturnValue({ method: "call" }),
    })),
    TransactionBuilder: Object.assign(
      jest.fn().mockImplementation(() => ({
        addOperation: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({}),
      })),
      {
        fromXDR: jest.fn(),
      },
    ),
    scValToNative: (value: unknown) => value,
  };
});

function makeRegistry() {
  return new FmcRegistryClient({
    contractId: "CREGISTRY",
    rpcUrl: "https://rpc.example",
    horizonUrl: "https://horizon.example",
    networkPassphrase: "Test Network",
  });
}

describe("FmcRegistryClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists registered campaign addresses", async () => {
    mockSimulateTransaction.mockResolvedValue({
      result: { retval: ["C1", "C2"] },
    });

    await expect(makeRegistry().list({ offset: 0, limit: 2 })).resolves.toEqual([
      "C1",
      "C2",
    ]);
  });

  it("filters campaign addresses by category", async () => {
    mockSimulateTransaction.mockResolvedValue({
      result: { retval: ["C2"] },
    });

    await expect(
      makeRegistry().getByCampaignCategory({
        categoryId: 3,
        offset: 0,
        limit: 10,
      }),
    ).resolves.toEqual(["C2"]);
  });

  it("listAll follows short-page pagination", async () => {
    mockSimulateTransaction
      .mockResolvedValueOnce({ result: { retval: ["C1", "C2"] } })
      .mockResolvedValueOnce({ result: { retval: ["C3"] } });

    await expect(makeRegistry().listAll(2)).resolves.toEqual(["C1", "C2", "C3"]);
  });
});
