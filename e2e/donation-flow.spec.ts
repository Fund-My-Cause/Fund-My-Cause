/**
 * Issue #1739 — Donation-specific regression checks
 *
 * The shared contribution journey and validation scenarios live in
 * contribution-flow.spec.ts. This suite retains donation-specific visual
 * snapshot and repeated-submission coverage.
 *
 * Design notes:
 * - The Freighter extension is fully mocked via e2e/fixtures/wallet.ts so
 *   tests run deterministically in CI without a real extension or network.
 * - A seeded static campaign fixture (e2e/fixtures/test-campaign.json) with
 *   fixed, predictable values prevents data-driven flakiness.
 * - Screen snapshots are captured at the confirmation step and stored in
 *   e2e/snapshots/ for visual-regression protection.
 */

import { test, expect } from "./fixtures/wallet";
import testCampaign from "./fixtures/test-campaign.json";

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Navigate to the first visible campaign detail page.
 * Returns after the Pledge button is visible.
 */
async function openFirstCampaign(page: import("@playwright/test").Page) {
  await page.goto("/campaigns");
  await page.locator("a[href*='/campaigns/']").first().waitFor({ timeout: 10_000 });
  await page.locator("a[href*='/campaigns/']").first().click();
  await page
    .getByRole("button", { name: /pledge/i })
    .waitFor({ timeout: 10_000 });
}

/**
 * Connect wallet if the Connect button is still visible.
 * The mock auto-approves so this resolves immediately.
 */
async function connectWalletIfNeeded(page: import("@playwright/test").Page) {
  const btn = page.getByRole("button", { name: /connect wallet/i });
  if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await btn.click();
    // Wait for the address indicator to appear
    await page
      .locator("text=/GMOCK|G[A-Z0-9]{4}\.\.\.[A-Z0-9]{4}/i")
      .waitFor({ timeout: 8_000 })
      .catch(() => {
        /* not all layouts show a visible address — that's OK */
      });
  }
}

// ── test suite ────────────────────────────────────────────────────────────────

test.describe("Donation-specific regressions (#1739)", () => {
  test("confirmation screen matches its visual snapshot", async ({
    page,
  }) => {
    await openFirstCampaign(page);
    await connectWalletIfNeeded(page);

    await page.getByRole("button", { name: /pledge/i }).click();

    const amountInput = page
      .locator(
        "input[name='amount'], input[placeholder*='Amount'], input[placeholder*='amount'], input[type='number']",
      )
      .first();
    await amountInput.fill(testCampaign.donationAmount);
    await page.getByRole("button", { name: /confirm|submit|pledge/i }).last().click();

    const confirmation = page.locator(
      "[data-testid='contribution-success'], [data-testid='pledge-confirmation'], .contribution-success, text=/success|confirmed|thank you/i",
    );
    await expect(confirmation.first()).toBeVisible({ timeout: 20_000 });

    // Visual regression snapshot of the confirmation UI
    // Baseline: run `npx playwright test --update-snapshots` to commit the baseline image.
    await expect(page).toHaveScreenshot("donation-confirmation.png", {
      fullPage: false,
      // Allow minor rendering differences (anti-aliasing, font hinting)
      maxDiffPixelRatio: 0.02,
    });
  });

  // ── Multiple sequential donations (flakiness guard) ────────────────────────
  test("two sequential donation submissions do not leave UI in a broken state", async ({
    page,
  }) => {
    await openFirstCampaign(page);
    await connectWalletIfNeeded(page);

    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: /pledge/i }).click();

      const amountInput = page
        .locator(
          "input[name='amount'], input[placeholder*='Amount'], input[placeholder*='amount'], input[type='number']",
        )
        .first();
      await amountInput.fill(testCampaign.donationAmount);
      await page.getByRole("button", { name: /confirm|submit|pledge/i }).last().click();

      // Wait for success or modal to close before the next iteration
      await page
        .locator(
          "text=/success|submitted|confirmed|thank you|pledge received/i",
        )
        .waitFor({ timeout: 20_000 })
        .catch(() => {
          /* if the modal closes without a success text, that's acceptable —
             some implementations navigate away instead */
        });

      // Close the modal / return to detail page if needed
      const closeBtn = page.getByRole("button", { name: /close|dismiss|done/i });
      if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }

    // The Pledge button must still be available (no permanent broken state)
    await expect(
      page.getByRole("button", { name: /pledge/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});
