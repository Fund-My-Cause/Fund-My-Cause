import type { Campaign } from "../packages/types/src/campaign";

export interface UserFixture {
  address: string;
  displayName: string;
  avatarUri: string;
  bio: string;
  socialLinks: string[];
  achievements: never[];
  totalPoints: number;
  contributionStreak: number;
  referralCode: string;
  referralsCount: number;
  level: number;
}

export interface TransactionFixture {
  txHash: string;
  contributor: string;
  amountXlm: number;
  timestamp: string;
  campaignId: string;
  campaignTitle: string;
  status: string;
}

/** Creates a fresh, deterministic campaign fixture with optional overrides. */
export function createCampaignFixture(
  overrides: Partial<Campaign> = {},
): Campaign {
  return {
    id: "campaign-test-001",
    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    title: "Clean Water Campaign",
    description: "Provide reliable access to clean water.",
    creator: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    goal: 1000,
    raised: 450,
    deadline: "2027-12-31T23:59:59.000Z",
    status: "Active",
    token: "native",
    ...overrides,
  };
}

/** Creates a fresh profile/gamification user fixture with optional overrides. */
export function createUserFixture(
  overrides: Partial<UserFixture> = {},
): UserFixture {
  return {
    address: "GUSER0000000000000000000000000000000000000000000000000",
    displayName: "Test User",
    avatarUri: "",
    bio: "Test user bio",
    socialLinks: [],
    achievements: [],
    totalPoints: 100,
    contributionStreak: 1,
    referralCode: "FMTEST123",
    referralsCount: 0,
    level: 1,
    ...overrides,
  };
}

/** Creates a fresh transaction-history fixture with optional overrides. */
export function createTransactionFixture(
  overrides: Partial<TransactionFixture> = {},
): TransactionFixture {
  return {
    txHash: "test-transaction-hash",
    contributor: "GUSER0000000000000000000000000000000000000000000000000",
    amountXlm: 10,
    timestamp: "2026-01-15T12:00:00.000Z",
    campaignId: "campaign-test-001",
    campaignTitle: "Clean Water Campaign",
    status: "Confirmed",
    ...overrides,
  };
}
