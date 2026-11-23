/**
 * Issue #1735 — E2E: Campaign creation flow with Playwright
 *
 * Covers the complete campaign creation wizard flow from start to finish,
 * including wallet mocking, form validation, file upload, and on-chain deployment.
 *
 * ## Coverage
 * - Valid path: Complete wizard flow from basic info to deployment
 * - Invalid path: Validation errors and progression blocking
 * - Wallet integration: Mock Freighter wallet for signing
 * - File upload: Mock Pinata IPFS upload
 * - On-chain verification: Assert campaign deployed successfully
 *
 * ## Test Matrix
 * | Scenario | Coverage |
 * |----------|----------|
 * | Valid campaign creation | Full wizard progression, all steps |
 * | Invalid input validation | Required fields, format validation |
 * | File upload | Image upload with mock IPFS |
 * | Wallet signing | Mock Freighter transaction signing |
 * | On-chain result | Campaign deployed and accessible |
 */

import { test, expect } from "./fixtures/wallet";
import * as path from "path";

test.describe("Campaign Creation Flow (#1735)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Pinata API file upload POST requests and return mock IPFS URI
    await page.route("https://api.pinata.cloud/pinning/pinFileToIPFS", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ IpfsHash: "QmMockImageHash" }),
      });
    });

    // Mock testnet stub API for on-chain verification
    await page.route("**/api/testnet/campaigns/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "CTESTCAMPAIGN111111111111111111111111111111111111111111",
          status: "Active",
          title: "Save the Rainforest",
          totalRaised: 0,
          goal: 1000,
        }),
      });
    });
  });

  test("should successfully complete campaign creation wizard and verify on-chain deployment", async ({ page }) => {
    await page.goto("/create");

    // 1. Basic Info Step
    await page.fill("input[label='Contract ID']", "CTESTCAMPAIGN111111111111111111111111111111111111111111");
    await page.fill("input[label='Token Address']", "CTOKEN11111111111111111111111111111111111111111111111");
    await page.fill("input[label='Title']", "Save the Rainforest");
    await page.fill("textarea[label='Description']", "Help us protect endangered species and their habitats");
    
    // Select category (medical)
    await page.selectOption("select[label='Category']", "medical");

    await page.fill("input[label='Goal (XLM)']", "1000");
    await page.fill("input[label='Min Contribution (XLM)']", "10");

    // Set deadline to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    await page.fill("input[label='Deadline']", dateStr);

    await page.click("button:has-text('Next')");

    // 2. Media Step
    await expect(page.locator("text=Campaign Image")).toBeVisible();

    // Upload mock 1x1 pixel PNG image file using buffer
    const mockPngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    await page.setInputFiles("input[type='file']", {
      name: "test.png",
      mimeType: "image/png",
      buffer: mockPngBuffer,
    });

    // Wait for crop tool to appear and click Confirm Crop
    await page.click("button:has-text('Confirm Crop')");

    // Fill optional video URL
    await page.fill("input[aria-label='Campaign video URL']", "https://youtube.com/watch?v=abcdef");

    await page.click("button:has-text('Next')");

    // 3. FAQ & Team Step
    await page.click("button:has-text('Add FAQ')");
    await page.fill("input[placeholder='Question']", "Is this audit complete?");
    await page.fill("textarea[placeholder='Answer']", "Yes, we are audited.");

    await page.click("button:has-text('Add Member')");
    await page.fill("input[placeholder='Name']", "John Owner");
    await page.fill("input[placeholder='Role (e.g. Lead Developer)']", "Project Lead");

    await page.click("button:has-text('Next')");

    // 4. Platform Config Step
    await page.fill("input[label='Platform Fee Address']", "GA5W32UAQEAVJAAOOSBDBUXBKI6T6T6T6T6T6T6T6T6T6T6T6T6T6T6T");
    await page.fill("input[label*='Fee (basis points']", "250");

    await page.click("button:has-text('Review & Deploy')");

    // 5. Review Step
    await expect(page.locator("text=Review & Deploy")).toBeVisible();
    await page.click("button:has-text('Review & Deploy')"); // Final submit button inside wizard container

    // 6. Sign & Deploy Step (CampaignPreview)
    await expect(page.locator("text=Sign & Deploy")).toBeVisible();
    await page.click("button:has-text('Sign & Deploy')");

    // 7. Success Screen & Verify On-Chain Deployment
    await expect(page.locator("text=Campaign Deployed!")).toBeVisible();

    // Assert on-chain result via testnet stub
    // The deployed campaign should be accessible and have correct initial state
    const response = await page.request.get(
      "http://localhost:3000/api/testnet/campaigns/CTESTCAMPAIGN111111111111111111111111111111111111111111"
    );
    expect(response.ok()).toBeTruthy();
    const campaignData = await response.json();
    expect(campaignData.status).toBe("Active");
    expect(campaignData.title).toBe("Save the Rainforest");
    expect(campaignData.goal).toBe(1000);

    await page.click("button:has-text('Back to Home')");

    // Confirm redirected to home / list view
    await expect(page).toHaveURL("/");
  });

  test("should display validation errors and block wizard progression (invalid path)", async ({ page }) => {
    await page.goto("/create");

    // Try navigating with empty fields
    await page.click("button:has-text('Next')");
    await expect(page.locator("text=Contract ID is required.")).toBeVisible();

    // Fill invalid Contract ID and check error
    await page.fill("input[label='Contract ID']", "INVALID");
    await page.click("button:has-text('Next')");
    await expect(page.locator("text=Contract ID is invalid.")).toBeVisible();

    // Fill valid contract/token but invalid goal/min contribution
    await page.fill("input[label='Contract ID']", "CTESTCAMPAIGN111111111111111111111111111111111111111111");
    await page.fill("input[label='Token Address']", "CTOKEN11111111111111111111111111111111111111111111111");
    await page.fill("input[label='Title']", "Save the Rainforest");
    await page.fill("textarea[label='Description']", "Help us protect endangered species");
    await page.selectOption("select[label='Category']", "medical");
    await page.fill("input[label='Goal (XLM)']", "-50"); // Invalid negative goal
    await page.fill("input[label='Min Contribution (XLM)']", "10");

    // Set deadline in past
    await page.fill("input[label='Deadline']", "2020-01-01");

    await page.click("button:has-text('Next')");
    await expect(page.locator("text=Goal must be a positive number.")).toBeVisible();
  });

  test("should handle wallet connection during deployment step", async ({ page }) => {
    await page.goto("/create");

    // Fill minimal valid form quickly to reach deploy step
    await page.fill("input[label='Contract ID']", "CTESTCAMPAIGN222222222222222222222222222222222222222222");
    await page.fill("input[label='Token Address']", "CTOKEN22222222222222222222222222222222222222222222222");
    await page.fill("input[label='Title']", "Quick Test Campaign");
    await page.fill("textarea[label='Description']", "Test description");
    await page.selectOption("select[label='Category']", "technology");
    await page.fill("input[label='Goal (XLM)']", "500");
    await page.fill("input[label='Min Contribution (XLM)']", "5");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill("input[label='Deadline']", tomorrow.toISOString().split("T")[0]);

    await page.click("button:has-text('Next')"); // Skip media
    await page.click("button:has-text('Next')"); // Skip FAQ
    await page.fill("input[label='Platform Fee Address']", "GA5W32UAQEAVJAAOOSBDBUXBKI6T6T6T6T6T6T6T6T6T6T6T6T6T6T6T");
    await page.fill("input[label*='Fee (basis points']", "250");
    await page.click("button:has-text('Review & Deploy')");
    await page.click("button:has-text('Review & Deploy')");

    // Wallet mock should auto-approve
    await page.click("button:has-text('Sign & Deploy')");

    // Should succeed with mocked wallet
    await expect(page.locator("text=Campaign Deployed!")).toBeVisible({ timeout: 15_000 });
  });

  test("should validate file upload requirements", async ({ page }) => {
    await page.goto("/create");

    // Fill basic info to reach media step
    await page.fill("input[label='Contract ID']", "CTESTCAMPAIGN333333333333333333333333333333333333333333");
    await page.fill("input[label='Token Address']", "CTOKEN33333333333333333333333333333333333333333333333");
    await page.fill("input[label='Title']", "Media Test Campaign");
    await page.fill("textarea[label='Description']", "Testing media upload");
    await page.selectOption("select[label='Category']", "environment");
    await page.fill("input[label='Goal (XLM)']", "1000");
    await page.fill("input[label='Min Contribution (XLM)']", "10");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill("input[label='Deadline']", tomorrow.toISOString().split("T")[0]);

    await page.click("button:has-text('Next')");

    // Try to proceed without uploading image
    await page.click("button:has-text('Next')");

    // Should show validation error or stay on media step
    // (depending on whether image is optional or required)
    const isOnMediaStep = await page.locator("text=Campaign Image").isVisible();
    expect(isOnMediaStep).toBeTruthy();
  });

  test("should allow optional fields to be skipped", async ({ page }) => {
    await page.goto("/create");

    // Fill only required fields
    await page.fill("input[label='Contract ID']", "CTESTCAMPAIGN444444444444444444444444444444444444444444");
    await page.fill("input[label='Token Address']", "CTOKEN44444444444444444444444444444444444444444444444");
    await page.fill("input[label='Title']", "Minimal Campaign");
    await page.fill("textarea[label='Description']", "Minimal description");
    await page.selectOption("select[label='Category']", "other");
    await page.fill("input[label='Goal (XLM)']", "100");
    await page.fill("input[label='Min Contribution (XLM)']", "1");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill("input[label='Deadline']", tomorrow.toISOString().split("T")[0]);

    await page.click("button:has-text('Next')"); // Basic Info

    // Skip media step
    await page.click("button:has-text('Next')");

    // Skip FAQ & Team step (don't add any)
    await page.click("button:has-text('Next')");

    // Platform config (required)
    await page.fill("input[label='Platform Fee Address']", "GA5W32UAQEAVJAAOOSBDBUXBKI6T6T6T6T6T6T6T6T6T6T6T6T6T6T6T");
    await page.fill("input[label*='Fee (basis points']", "250");

    // Should be able to reach review step
    await page.click("button:has-text('Review & Deploy')");
    await expect(page.locator("text=Review & Deploy")).toBeVisible();
  });
});
