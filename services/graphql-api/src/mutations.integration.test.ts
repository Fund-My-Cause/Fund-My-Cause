import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { ApolloServer } from "@apollo/server";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import type { Context } from "./types.js";

/**
 * Integration tests for GraphQL mutation flows — supplements
 * server.integration.test.ts which already covers createCampaign and
 * authenticate happy paths.
 *
 * Scenarios covered here:
 *  1. recordContribution — success path (authenticated)
 *  2. recordContribution — unauthenticated rejection
 *  3. recordContribution — invalid amount (too small, fails validateDonationAmount)
 *  4. updateCampaign — success path (authenticated)
 *  5. updateCampaign — unauthenticated rejection
 *  6. createCampaign — validation errors (empty title + past deadline)
 *  7. authenticate — invalid signature path
 *  8. Cache invalidation verification for recordContribution
 */

// ── Fraud-client mock ──────────────────────────────────────────────────────────
// notifyContribution is fire-and-forget (called with `void`) so we only need to
// prevent the real HTTP call from being made.
vi.mock("./services/fraud-client.js", () => ({
  notifyContribution: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function createMockContext(overrides: Partial<Context> = {}): Context {
  const dataLoader = {
    campaigns: { load: vi.fn() },
    contributions: { load: vi.fn() },
    users: { load: vi.fn() },
    campaignContributors: { load: vi.fn() },
    campaignContributions: { load: vi.fn() },
    campaignUpdates: { load: vi.fn() },
    campaignMilestones: { load: vi.fn() },
    campaignsByStatus: { load: vi.fn() },
    userCampaigns: { load: vi.fn() },
    userContributions: { load: vi.fn() },
  };

  return {
    cache: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
    },
    contractService: {
      getCampaign: vi.fn(),
      getCampaigns: vi.fn(),
      getCampaignCount: vi.fn(),
      getTrendingCampaigns: vi.fn(),
      searchCampaigns: vi.fn(),
      getUser: vi.fn(),
      getStats: vi.fn(),
      verifySignature: vi.fn(),
      createCampaign: vi.fn(),
      updateCampaign: vi.fn(),
      recordContribution: vi.fn(),
    },
    dataLoader: dataLoader as any,
    pubsub: {
      publish: vi.fn().mockResolvedValue(undefined),
      asyncIterator: vi.fn(),
    } as any,
    authService: {
      generateToken: vi.fn(),
    } as any,
    user: undefined,
    redis: {} as any,
    // Required by recordContribution resolver
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any,
    traceId: "test-trace-id",
    ...overrides,
  } as Context;
}

const sampleContribution = (overrides: Record<string, any> = {}) => ({
  id: "contrib_1",
  campaignId: "camp_1",
  contributor: "GCONTRIBUTOR",
  amount: BigInt("10000000"), // 1 XLM in stroops
  transactionHash: "txhash_abc123",
  timestamp: new Date().toISOString(),
  ...overrides,
});

const sampleCampaign = (overrides: Record<string, any> = {}) => ({
  id: "camp_1",
  contractId: "contract_1",
  title: "Clean Water Initiative",
  description: "A campaign",
  creator: "GCREATOR",
  goal: BigInt("10000000000"),
  raised: BigInt("5000000000"),
  deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  status: "Active",
  category: "Health",
  minContribution: BigInt("1000000"),
  totalContributors: 10,
  token: "native",
  platformFeeBps: 250,
  hasRBACEnabled: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

async function execute(
  server: ApolloServer<Context>,
  query: string,
  variables: Record<string, any>,
  context: Context,
) {
  const response = await server.executeOperation(
    { query, variables },
    { contextValue: context },
  );
  if (response.body.kind !== "single") {
    throw new Error("Expected a single GraphQL response");
  }
  return response.body.singleResult;
}

// ── Mutation strings ───────────────────────────────────────────────────────────

const RECORD_CONTRIBUTION_MUTATION = `
  mutation RecordContribution($input: RecordContributionInput!) {
    recordContribution(input: $input) {
      id
      campaignId
      contributor
      amount
      transactionHash
    }
  }
`;

const UPDATE_CAMPAIGN_MUTATION = `
  mutation UpdateCampaign($id: ID!, $input: UpdateCampaignInput!) {
    updateCampaign(id: $id, input: $input) {
      id
      title
      description
    }
  }
`;

const CREATE_CAMPAIGN_MUTATION = `
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) { id title }
  }
`;

const AUTHENTICATE_MUTATION = `
  mutation Authenticate($signature: String!, $message: String!, $address: String!) {
    authenticate(signature: $signature, message: $message, address: $address) {
      token
      user { address }
    }
  }
`;

// ── Test suite ─────────────────────────────────────────────────────────────────

describe("GraphQL mutation integration tests", () => {
  let server: ApolloServer<Context>;

  beforeAll(async () => {
    server = new ApolloServer<Context>({ typeDefs, resolvers });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  // ── 1. recordContribution — success path ──────────────────────────────────

  it("records a contribution end-to-end for an authenticated user", async () => {
    const context = createMockContext({
      user: { address: "GCONTRIBUTOR", isAuthenticated: true },
    });
    const contribution = sampleContribution();
    (context.contractService.recordContribution as any).mockResolvedValue(
      contribution,
    );
    // getCampaign is called after the contribution to publish progress events
    (context.contractService.getCampaign as any).mockResolvedValue(
      sampleCampaign(),
    );

    const result = await execute(
      server,
      RECORD_CONTRIBUTION_MUTATION,
      {
        input: {
          campaignId: "camp_1",
          contributor: "GCONTRIBUTOR",
          amount: "10000000", // 1 XLM in stroops — above minimum
          transactionHash: "txhash_abc123",
        },
      },
      context,
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.recordContribution).toMatchObject({
      id: "contrib_1",
      campaignId: "camp_1",
      contributor: "GCONTRIBUTOR",
      transactionHash: "txhash_abc123",
    });
    expect(context.contractService.recordContribution).toHaveBeenCalledOnce();
  });

  // ── 2. recordContribution — unauthenticated rejection ─────────────────────

  it("rejects recordContribution for an unauthenticated request", async () => {
    const context = createMockContext({ user: undefined });

    const result = await execute(
      server,
      RECORD_CONTRIBUTION_MUTATION,
      {
        input: {
          campaignId: "camp_1",
          contributor: "GCONTRIBUTOR",
          amount: "10000000",
          transactionHash: "txhash_abc123",
        },
      },
      context,
    );

    // recordContribution is non-null in the schema — thrown error nullifies data
    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.message).toBe("Authentication required");
    expect(context.contractService.recordContribution).not.toHaveBeenCalled();
  });

  // ── 3. recordContribution — invalid amount (too small) ────────────────────

  it("rejects recordContribution when amount is below the minimum contribution threshold", async () => {
    const context = createMockContext({
      user: { address: "GCONTRIBUTOR", isAuthenticated: true },
    });

    // 100 stroops = 0.00001 XLM — well below the 1 XLM minimum
    const result = await execute(
      server,
      RECORD_CONTRIBUTION_MUTATION,
      {
        input: {
          campaignId: "camp_1",
          contributor: "GCONTRIBUTOR",
          amount: "100",
          transactionHash: "txhash_abc123",
        },
      },
      context,
    );

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
    expect(context.contractService.recordContribution).not.toHaveBeenCalled();
  });

  // ── 4. updateCampaign — success path ──────────────────────────────────────

  it("updates a campaign end-to-end for an authenticated user", async () => {
    const context = createMockContext({
      user: { address: "GCREATOR", isAuthenticated: true },
    });
    const updated = sampleCampaign({
      title: "Updated Title",
      description: "Updated description",
    });
    (context.contractService.updateCampaign as any).mockResolvedValue(updated);

    const result = await execute(
      server,
      UPDATE_CAMPAIGN_MUTATION,
      {
        id: "camp_1",
        input: {
          title: "Updated Title",
          description: "Updated description",
        },
      },
      context,
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.updateCampaign).toMatchObject({
      id: "camp_1",
      title: "Updated Title",
      description: "Updated description",
    });
    expect(context.contractService.updateCampaign).toHaveBeenCalledWith(
      "camp_1",
      context.user,
      { title: "Updated Title", description: "Updated description" },
    );
    // Cache entries for this campaign should be invalidated
    expect(context.cache.del).toHaveBeenCalledWith("campaign:camp_1");
    expect(context.cache.delPattern).toHaveBeenCalledWith("campaigns:*");
  });

  // ── 5. updateCampaign — unauthenticated rejection ─────────────────────────

  it("rejects updateCampaign for an unauthenticated request", async () => {
    const context = createMockContext({ user: undefined });

    const result = await execute(
      server,
      UPDATE_CAMPAIGN_MUTATION,
      {
        id: "camp_1",
        input: { title: "Hacked Title" },
      },
      context,
    );

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.message).toBe("Authentication required");
    expect(context.contractService.updateCampaign).not.toHaveBeenCalled();
  });

  // ── 6. createCampaign — validation errors ─────────────────────────────────

  it("rejects createCampaign with BAD_USER_INPUT when title is empty", async () => {
    const context = createMockContext({
      user: { address: "GCREATOR", isAuthenticated: true },
    });

    const result = await execute(
      server,
      CREATE_CAMPAIGN_MUTATION,
      {
        input: {
          title: "", // empty title — validation failure
          description: "Some description",
          goal: "1000000000",
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          category: "Health",
          minContribution: "1000000",
        },
      },
      context,
    );

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
    expect(
      (result.errors?.[0]?.extensions?.validationErrors as any)?.title,
    ).toBeDefined();
    expect(context.contractService.createCampaign).not.toHaveBeenCalled();
  });

  it("rejects createCampaign with BAD_USER_INPUT when deadline is in the past", async () => {
    const context = createMockContext({
      user: { address: "GCREATOR", isAuthenticated: true },
    });

    const result = await execute(
      server,
      CREATE_CAMPAIGN_MUTATION,
      {
        input: {
          title: "Valid Title",
          description: "Some description",
          goal: "1000000000",
          deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
          category: "Health",
          minContribution: "1000000",
        },
      },
      context,
    );

    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
    expect(
      (result.errors?.[0]?.extensions?.validationErrors as any)?.deadline,
    ).toBeDefined();
    expect(context.contractService.createCampaign).not.toHaveBeenCalled();
  });

  // ── 7. authenticate — invalid signature path ──────────────────────────────

  it("rejects authenticate when the signature verification fails", async () => {
    const context = createMockContext();
    (context.contractService.verifySignature as any).mockResolvedValue(false);

    const result = await execute(
      server,
      AUTHENTICATE_MUTATION,
      {
        signature: "invalid-signature",
        message: "msg",
        address: "GADDR",
      },
      context,
    );

    // authenticate is non-null — error nullifies the whole data object
    expect(result.data).toBeNull();
    expect(result.errors?.[0]?.message).toBe("Invalid signature");
    expect(context.authService.generateToken).not.toHaveBeenCalled();
  });

  // ── 8. Cache invalidation for recordContribution ──────────────────────────

  it("invalidates all relevant cache keys after a successful recordContribution", async () => {
    const context = createMockContext({
      user: { address: "GCONTRIBUTOR", isAuthenticated: true },
    });
    const contribution = sampleContribution({ campaignId: "camp_42" });
    (context.contractService.recordContribution as any).mockResolvedValue(
      contribution,
    );
    (context.contractService.getCampaign as any).mockResolvedValue(
      sampleCampaign({ id: "camp_42" }),
    );

    await execute(
      server,
      RECORD_CONTRIBUTION_MUTATION,
      {
        input: {
          campaignId: "camp_42",
          contributor: "GCONTRIBUTOR",
          amount: "10000000",
          transactionHash: "txhash_cache_test",
        },
      },
      context,
    );

    // Per-campaign cache entry
    expect(context.cache.del).toHaveBeenCalledWith("campaign:camp_42");
    // Platform-wide stats cache
    expect(context.cache.del).toHaveBeenCalledWith("platform:stats");
    // Per-contributor user cache
    expect(context.cache.del).toHaveBeenCalledWith("user:GCONTRIBUTOR");
    // List and trending caches (pattern deletes)
    expect(context.cache.delPattern).toHaveBeenCalledWith("campaigns:*");
    expect(context.cache.delPattern).toHaveBeenCalledWith("trending:*");
  });
});
