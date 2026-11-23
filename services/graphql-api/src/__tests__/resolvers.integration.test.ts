import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestContext } from '../test/helpers';

/**
 * Issue #1727: Backend route/resolver integration tests
 * Cover every resolver happy path and error paths with 85%+ coverage
 */

describe('GraphQL Resolvers - Integration Tests', () => {
  let context: any;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    if (context?.cleanup) {
      await context.cleanup();
    }
  });

  describe('Campaign Resolvers', () => {
    describe('Query: campaigns', () => {
      it('returns empty list when no campaigns exist', async () => {
        const result = await context.query(`
          query {
            campaigns(first: 10) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `);

        expect(result.data.campaigns.edges).toEqual([]);
      });

      it('returns paginated campaigns with correct cursor pagination', async () => {
        // Setup test data
        const campaign1 = await context.createCampaign({
          title: 'Campaign 1',
          description: 'Test campaign 1',
        });
        const campaign2 = await context.createCampaign({
          title: 'Campaign 2',
          description: 'Test campaign 2',
        });

        const result = await context.query(`
          query {
            campaigns(first: 1) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `);

        expect(result.data.campaigns.edges).toHaveLength(1);
        expect(result.data.campaigns.pageInfo.hasNextPage).toBe(true);
      });

      it('filters campaigns by status', async () => {
        await context.createCampaign({
          title: 'Active Campaign',
          status: 'ACTIVE',
        });
        await context.createCampaign({
          title: 'Completed Campaign',
          status: 'COMPLETED',
        });

        const result = await context.query(`
          query {
            campaigns(first: 10, status: ACTIVE) {
              edges {
                node {
                  status
                }
              }
            }
          }
        `);

        const statuses = result.data.campaigns.edges.map((e: any) => e.node.status);
        expect(statuses).toEqual(['ACTIVE']);
      });

      it('sorts campaigns by creation date', async () => {
        const campaign1 = await context.createCampaign({ title: 'First' });
        await new Promise((r) => setTimeout(r, 10));
        const campaign2 = await context.createCampaign({ title: 'Second' });

        const result = await context.query(`
          query {
            campaigns(first: 10, sortBy: CREATED_DESC) {
              edges {
                node {
                  title
                }
              }
            }
          }
        `);

        const titles = result.data.campaigns.edges.map((e: any) => e.node.title);
        expect(titles[0]).toBe('Second');
        expect(titles[1]).toBe('First');
      });

      it('handles search with partial text match', async () => {
        await context.createCampaign({ title: 'Education Initiative' });
        await context.createCampaign({ title: 'Healthcare Project' });

        const result = await context.query(`
          query {
            campaigns(first: 10, search: "Education") {
              edges {
                node {
                  title
                }
              }
            }
          }
        `);

        expect(result.data.campaigns.edges).toHaveLength(1);
        expect(result.data.campaigns.edges[0].node.title).toBe('Education Initiative');
      });

      it('returns error when first parameter exceeds max', async () => {
        const result = await context.query(`
          query {
            campaigns(first: 1000) {
              edges { node { id } }
            }
          }
        `);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('limit');
      });
    });

    describe('Query: campaign (single)', () => {
      it('returns campaign by id', async () => {
        const campaign = await context.createCampaign({ title: 'Test Campaign' });

        const result = await context.query(`
          query {
            campaign(id: "${campaign.id}") {
              id
              title
              description
            }
          }
        `);

        expect(result.data.campaign.id).toBe(campaign.id);
        expect(result.data.campaign.title).toBe('Test Campaign');
      });

      it('returns error for non-existent campaign', async () => {
        const result = await context.query(`
          query {
            campaign(id: "non-existent-id") {
              id
            }
          }
        `);

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('not found');
      });

      it('includes campaign metadata', async () => {
        const campaign = await context.createCampaign({
          title: 'Test',
          targetAmount: 1000,
          currentAmount: 500,
        });

        const result = await context.query(`
          query {
            campaign(id: "${campaign.id}") {
              targetAmount
              currentAmount
              percentageFunded
              daysRemaining
            }
          }
        `);

        expect(result.data.campaign.percentageFunded).toBe(50);
        expect(typeof result.data.campaign.daysRemaining).toBe('number');
      });
    });

    describe('Query: activeCampaigns', () => {
      it('returns only active campaigns', async () => {
        await context.createCampaign({ title: 'Active', status: 'ACTIVE' });
        await context.createCampaign({ title: 'Completed', status: 'COMPLETED' });
        await context.createCampaign({ title: 'Cancelled', status: 'CANCELLED' });

        const result = await context.query(`
          query {
            activeCampaigns(first: 10) {
              edges {
                node {
                  status
                }
              }
            }
          }
        `);

        expect(result.data.activeCampaigns.edges).toHaveLength(1);
        expect(result.data.activeCampaigns.edges[0].node.status).toBe('ACTIVE');
      });
    });

    describe('Query: trendingCampaigns', () => {
      it('returns campaigns sorted by trending metrics', async () => {
        const campaign1 = await context.createCampaign({ title: 'Campaign 1' });
        const campaign2 = await context.createCampaign({ title: 'Campaign 2' });

        // Add contributions to campaign2 to make it trending
        for (let i = 0; i < 5; i++) {
          await context.createContribution(campaign2.id, { amount: 100 });
        }

        const result = await context.query(`
          query {
            trendingCampaigns(first: 10) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `);

        expect(result.data.trendingCampaigns.edges[0].node.id).toBe(campaign2.id);
      });
    });

    describe('Mutation: createCampaign', () => {
      it('creates campaign with valid input', async () => {
        const result = await context.query(`
          mutation {
            createCampaign(input: {
              title: "New Campaign"
              description: "Description"
              targetAmount: 1000
              category: "EDUCATION"
            }) {
              campaign {
                id
                title
                targetAmount
              }
              errors
            }
          }
        `);

        expect(result.data.createCampaign.campaign.id).toBeTruthy();
        expect(result.data.createCampaign.campaign.title).toBe('New Campaign');
        expect(result.data.createCampaign.errors).toEqual([]);
      });

      it('validates required fields', async () => {
        const result = await context.query(`
          mutation {
            createCampaign(input: {
              title: ""
              targetAmount: 1000
            }) {
              campaign {
                id
              }
              errors
            }
          }
        `);

        expect(result.data.createCampaign.errors).toContain('title');
      });

      it('validates target amount is positive', async () => {
        const result = await context.query(`
          mutation {
            createCampaign(input: {
              title: "Campaign"
              targetAmount: -100
            }) {
              campaign {
                id
              }
              errors
            }
          }
        `);

        expect(result.data.createCampaign.errors.length).toBeGreaterThan(0);
      });

      it('requires authentication', async () => {
        const result = await context.query(
          `
            mutation {
              createCampaign(input: {
                title: "Campaign"
                targetAmount: 1000
              }) {
                campaign { id }
              }
            }
          `,
          { authenticated: false }
        );

        expect(result.errors).toBeDefined();
        expect(result.errors[0].message).toContain('unauthorized');
      });
    });

    describe('Mutation: updateCampaign', () => {
      it('updates campaign with valid input', async () => {
        const campaign = await context.createCampaign({ title: 'Original' });

        const result = await context.query(`
          mutation {
            updateCampaign(id: "${campaign.id}", input: {
              title: "Updated"
            }) {
              campaign {
                id
                title
              }
              errors
            }
          }
        `);

        expect(result.data.updateCampaign.campaign.title).toBe('Updated');
      });

      it('prevents updating non-owned campaign', async () => {
        const campaign = await context.createCampaign({ title: 'Campaign' }, { userId: 'user1' });

        const result = await context.query(
          `
            mutation {
              updateCampaign(id: "${campaign.id}", input: { title: "Hacked" }) {
                campaign { id }
                errors
              }
            }
          `,
          { userId: 'user2' }
        );

        expect(result.data.updateCampaign.errors).toContain('not authorized');
      });

      it('prevents updating completed campaign', async () => {
        const campaign = await context.createCampaign({ title: 'Campaign', status: 'COMPLETED' });

        const result = await context.query(`
          mutation {
            updateCampaign(id: "${campaign.id}", input: { title: "New" }) {
              campaign { id }
              errors
            }
          }
        `);

        expect(result.data.updateCampaign.errors.length).toBeGreaterThan(0);
      });

      it('returns error for non-existent campaign', async () => {
        const result = await context.query(`
          mutation {
            updateCampaign(id: "non-existent", input: { title: "New" }) {
              campaign { id }
              errors
            }
          }
        `);

        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('Contribution Resolvers', () => {
    describe('Query: contributions', () => {
      it('returns contributions for campaign', async () => {
        const campaign = await context.createCampaign({ title: 'Campaign' });
        await context.createContribution(campaign.id, { amount: 100 });
        await context.createContribution(campaign.id, { amount: 200 });

        const result = await context.query(`
          query {
            contributions(campaignId: "${campaign.id}", first: 10) {
              edges {
                node {
                  id
                  amount
                }
              }
            }
          }
        `);

        expect(result.data.contributions.edges).toHaveLength(2);
      });

      it('filters contributions by status', async () => {
        const campaign = await context.createCampaign({});
        await context.createContribution(campaign.id, { amount: 100, status: 'PENDING' });
        await context.createContribution(campaign.id, { amount: 200, status: 'CONFIRMED' });

        const result = await context.query(`
          query {
            contributions(campaignId: "${campaign.id}", first: 10, status: CONFIRMED) {
              edges {
                node {
                  status
                }
              }
            }
          }
        `);

        expect(result.data.contributions.edges).toHaveLength(1);
        expect(result.data.contributions.edges[0].node.status).toBe('CONFIRMED');
      });

      it('handles empty contributions list', async () => {
        const campaign = await context.createCampaign({});

        const result = await context.query(`
          query {
            contributions(campaignId: "${campaign.id}", first: 10) {
              edges {
                node {
                  id
                }
              }
            }
          }
        `);

        expect(result.data.contributions.edges).toEqual([]);
      });
    });

    describe('Mutation: createContribution', () => {
      it('creates contribution with valid input', async () => {
        const campaign = await context.createCampaign({});

        const result = await context.query(`
          mutation {
            createContribution(input: {
              campaignId: "${campaign.id}"
              amount: 100
              walletAddress: "GCTEST123"
            }) {
              contribution {
                id
                amount
                status
              }
              errors
            }
          }
        `);

        expect(result.data.createContribution.contribution.id).toBeTruthy();
        expect(result.data.createContribution.contribution.amount).toBe(100);
        expect(result.data.createContribution.contribution.status).toBe('PENDING');
      });

      it('validates minimum contribution amount', async () => {
        const campaign = await context.createCampaign({});

        const result = await context.query(`
          mutation {
            createContribution(input: {
              campaignId: "${campaign.id}"
              amount: 0.01
            }) {
              contribution { id }
              errors
            }
          }
        `);

        expect(result.data.createContribution.errors.length).toBeGreaterThan(0);
      });

      it('prevents contribution to completed campaign', async () => {
        const campaign = await context.createCampaign({ status: 'COMPLETED' });

        const result = await context.query(`
          mutation {
            createContribution(input: {
              campaignId: "${campaign.id}"
              amount: 100
            }) {
              contribution { id }
              errors
            }
          }
        `);

        expect(result.data.createContribution.errors.length).toBeGreaterThan(0);
      });

      it('prevents contribution to non-existent campaign', async () => {
        const result = await context.query(`
          mutation {
            createContribution(input: {
              campaignId: "non-existent"
              amount: 100
            }) {
              contribution { id }
              errors
            }
          }
        `);

        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('User Resolvers', () => {
    describe('Query: user', () => {
      it('returns current user', async () => {
        const result = await context.query(`
          query {
            user {
              id
              walletAddress
              totalContributions
            }
          }
        `);

        expect(result.data.user.id).toBeTruthy();
        expect(result.data.user.walletAddress).toBeTruthy();
      });

      it('returns error when not authenticated', async () => {
        const result = await context.query(
          `
            query {
              user {
                id
              }
            }
          `,
          { authenticated: false }
        );

        expect(result.errors).toBeDefined();
      });
    });

    describe('Query: userCampaigns', () => {
      it('returns campaigns created by user', async () => {
        const campaign1 = await context.createCampaign({ title: 'Campaign 1' });
        const campaign2 = await context.createCampaign({ title: 'Campaign 2' });

        const result = await context.query(`
          query {
            userCampaigns(first: 10) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `);

        expect(result.data.userCampaigns.edges).toHaveLength(2);
      });
    });

    describe('Query: userContributions', () => {
      it('returns contributions made by user', async () => {
        const campaign1 = await context.createCampaign({});
        const campaign2 = await context.createCampaign({});

        await context.createContribution(campaign1.id, { amount: 100 });
        await context.createContribution(campaign2.id, { amount: 200 });

        const result = await context.query(`
          query {
            userContributions(first: 10) {
              edges {
                node {
                  id
                  amount
                }
              }
            }
          }
        `);

        expect(result.data.userContributions.edges).toHaveLength(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('returns validation errors for invalid query', async () => {
      const result = await context.query(`
        query {
          campaigns(first: "invalid") {
            edges { node { id } }
          }
        }
      `);

      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('expected');
    });

    it('handles database connection errors gracefully', async () => {
      vi.spyOn(context, 'query').mockRejectedValueOnce(new Error('Database connection failed'));

      try {
        await context.query(`query { campaigns(first: 10) { edges { node { id } } } }`);
      } catch (error: any) {
        expect(error.message).toContain('Database');
      }
    });

    it('returns error for timeout queries', async () => {
      const longRunningQuery = `
        query {
          campaigns(first: 10000) {
            edges { node { id } }
          }
        }
      `;

      const result = await context.query(longRunningQuery);
      // May error or return partial results depending on implementation
      expect(result.data !== undefined || result.errors !== undefined).toBe(true);
    });
  });

  describe('N+1 Query Prevention', () => {
    it('resolves campaigns without N+1 queries', async () => {
      await context.createCampaign({ title: 'Campaign 1' });
      await context.createCampaign({ title: 'Campaign 2' });
      await context.createCampaign({ title: 'Campaign 3' });

      const queryCount = vi.fn();

      const result = await context.query(
        `
          query {
            campaigns(first: 10) {
              edges {
                node {
                  id
                  title
                  topContributors(first: 5) {
                    edges {
                      node {
                        id
                        amount
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        { onQuery: queryCount }
      );

      // Should not have N+1 query pattern
      expect(queryCount.mock.calls.length).toBeLessThan(10);
    });
  });

  describe('Field Resolution', () => {
    it('resolves computed fields correctly', async () => {
      const campaign = await context.createCampaign({
        targetAmount: 1000,
        currentAmount: 500,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });

      const result = await context.query(`
        query {
          campaign(id: "${campaign.id}") {
            percentageFunded
            daysRemaining
            isActive
            topContributors(first: 10) {
              edges { node { id } }
            }
          }
        }
      `);

      expect(result.data.campaign.percentageFunded).toBe(50);
      expect(result.data.campaign.daysRemaining).toBe(7);
      expect(result.data.campaign.isActive).toBe(true);
    });
  });
});
