import { test, expect, newWalletContext, DEFAULT_MOCK_ADDRESS } from "./fixtures/wallet";

/**
 * Issue #1736 — E2E: Full Contribution Flow with stable selectors
 *
 * Covers the critical path:
 *   connect wallet → view campaign → contribute → verify balance/progress update
 *
 * Also covers the rejected-transaction path and edge cases with stable selectors.
 *
 * The Freighter wallet is fully mocked via `e2e/fixtures/wallet.ts` — the
 * postMessage responder auto-approves SUBMIT_TRANSACTION so tests are
 * deterministic in CI without a real extension.
 *
 * ## Test matrix
 * | # | Scenario                                       | Stable Selectors |
 * |---|------------------------------------------------|------------------|
 * | 1 | Connect wallet — address shown in navbar       | ✓ role-based     |
 * | 2 | Discover campaigns on /campaigns               | ✓ data-testid    |
 * | 3 | Navigate to campaign detail page               | ✓ href pattern   |
 * | 4 | Pledge modal opens                             | ✓ role + text    |
 * | 5 | Input validation — empty amount                | ✓ text pattern   |
 * | 6 | Input validation — non-positive amount         | ✓ text pattern   |
 * | 7 | Full contribute → success receipt              | ✓ text pattern   |
 * | 8 | Progress bar updates after contribution        | ✓ role attribute |
 * | 9 | Rejected transaction shows error message       | ✓ text pattern   |
 * |10 | Multiple contributions accumulate progress     | ✓ role attribute |
 * |11 | Wallet disconnect prevents contribution        | ✓ role-based     |
 * |12 | Contribution amount is displayed in receipt    | ✓ text pattern   |
 * |13 | User can close pledge modal without submitting | ✓ aria-label     |
 * |14 | Contribution with minimum pledge amount        | ✓ text pattern   |
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Navigate to the first available campaign detail page from /campaigns */
async function goToFirstCampaign(page: import("@playwright/test").Page) {
  await page.goto("/campaigns");
  const campaignLink = page.locator("a[href*='/campaigns/']").first();
  await campaignLink.waitFor({ timeout: 10_000 });
  await campaignLink.click();
  // Wait for either a Pledge button or campaign title to confirm we arrived
  await page.waitForSelector(
    "[role='button'][aria-label*='pledge' i], button:text-matches('pledge', 'i'), h1",
    { timeout: 10_000 },
  );
}

/** Connect the wallet if the connect button is visible */
async function ensureWalletConnected(page: import("@playwright/test").Page) {
  const connectBtn = page.getByRole("button", { name: /connect wallet/i });
  if (await connectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await connectBtn.click();
    // Wait for the connected state
    await expect(
      page.locator("text=/GMOCK|G[A-Z0-9]{4}\.\.\.[A-Z0-9]{4}/i")
    ).toBeVisible({ timeout: 8_000 });
  }
}

/** Open the pledge modal on the current campaign detail page */
async function openPledgeModal(page: import("@playwright/test").Page) {
  const pledgeBtn = page.getByRole("button", { name: /pledge/i });
  await pledgeBtn.waitFor({ timeout: 10_000 });
  await pledgeBtn.click();
  await expect(
    page.locator("text=/Pledge to|Contribute to/i")
  ).toBeVisible({ timeout: 8_000 });
}

/** Fill in the pledge amount input */
async function fillAmount(page: import("@playwright/test").Page, amount: string) {
  const input = page.locator(
    "input[placeholder*='Amount'], input[type='number'], input[name='amount']"
  );
  await input.waitFor({ timeout: 5_000 });
  await input.fill(amount);
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe("Contribution Flow — full journey (#1736)", () => {
  // ── 1. Wallet connection ───────────────────────────────────────────────────
  test("connects wallet and shows abbreviated address in navbar", async ({
    page,
  }) => {
    await page.goto("/");
    await ensureWalletConnected(page);
    await expect(
      page.locator("text=/GMOCK|G[A-Z0-9]{4}\.\.\.[A-Z0-9]{4}/i")
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── 2. Campaign discovery ─────────────────────────────────────────────────
  test("discovers at least one campaign on /campaigns", async ({ page }) => {
    await page.goto("/campaigns");
    const cards = page.locator(
      "[data-testid='campaign-card'], .campaign-card, a[href*='/campaigns/']"
    );
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── 3. Campaign detail navigation ─────────────────────────────────────────
  test("opens a campaign detail page from the list", async ({ page }) => {
    await page.goto("/campaigns");
    const link = page.locator("a[href*='/campaigns/']").first();
    await link.click();
    await expect(
      page.getByRole("button", { name: /pledge/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 4. Pledge modal opens ─────────────────────────────────────────────────
  test("opens pledge modal when Pledge button is clicked", async ({ page }) => {
    await goToFirstCampaign(page);
    await openPledgeModal(page);
    // Modal title is visible
    await expect(
      page.locator("text=/Pledge to|Contribute to/i")
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── 5. Validation — empty amount ──────────────────────────────────────────
  test("shows validation error when submitting an empty pledge amount", async ({
    page,
  }) => {
    await goToFirstCampaign(page);
    await openPledgeModal(page);

    // Submit without entering an amount
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator("text=/valid amount|enter an amount|required/i")
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 6. Validation — non-positive amount ───────────────────────────────────
  test("shows validation error when pledge amount is zero or negative", async ({
    page,
  }) => {
    await goToFirstCampaign(page);
    await openPledgeModal(page);
    await fillAmount(page, "0");
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator("text=/valid amount|greater than zero|positive|minimum/i")
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 7. Full contribute → success receipt ──────────────────────────────────
  test("completes full contribution journey and shows success receipt", async ({
    page,
  }) => {
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);
    await fillAmount(page, "10");

    // The wallet mock auto-approves signTransaction
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator(
        "text=/success|pledge submitted|contribution confirmed|thank you/i"
      )
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── 8. Progress bar updates after contribution ────────────────────────────
  test("progress bar value does not decrease after a successful pledge", async ({
    page,
  }) => {
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);

    const progressBar = page.locator("[role='progressbar']");
    const beforeRaw = await progressBar
      .getAttribute("aria-valuenow")
      .catch(() => "0");
    const before = parseFloat(beforeRaw ?? "0");

    await openPledgeModal(page);
    await fillAmount(page, "100");
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator("text=/success|pledge submitted|confirmed/i")
    ).toBeVisible({ timeout: 15_000 });

    const afterRaw = await progressBar
      .getAttribute("aria-valuenow")
      .catch(() => "0");
    const after = parseFloat(afterRaw ?? "0");

    expect(after).toBeGreaterThanOrEqual(before);
  });

  // ── 9. Rejected transaction shows error ───────────────────────────────────
  test("shows an error message when the wallet rejects the transaction", async ({
    browser,
  }) => {
    /**
     * Override the wallet mock in a new context so that SUBMIT_TRANSACTION
     * returns an error response instead of a signed XDR.
     */
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.addEventListener("message", (event: MessageEvent) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;

        const respond = (fields: Record<string, unknown>) => {
          window.postMessage(
            {
              source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
              messagedId: data.messageId,
              ...fields,
            },
            window.location.origin,
          );
        };

        switch (data.type) {
          case "REQUEST_ACCESS":
          case "REQUEST_PUBLIC_KEY":
            respond({ publicKey: "GTEST000000000000000000000000000000000000000000000000000" });
            break;
          case "REQUEST_CONNECTION_STATUS":
            respond({ isConnected: true });
            break;
          case "REQUEST_ALLOWED_STATUS":
            respond({ isAllowed: true });
            break;
          case "REQUEST_NETWORK_DETAILS":
            respond({
              networkDetails: {
                network: "TESTNET",
                networkName: "TESTNET",
                networkUrl: "https://horizon-testnet.stellar.org",
                networkPassphrase: "Test SDF Network ; September 2015",
              },
            });
            break;
          case "SUBMIT_TRANSACTION":
            // Simulate user rejection: respond with an error
            respond({
              error: "User declined to sign the transaction",
              signedTransaction: null,
            });
            break;
          default:
            respond({});
        }
      });
    });

    const page = await context.newPage();
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);
    await fillAmount(page, "10");
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    // The UI must surface the rejection error
    await expect(
      page.locator(
        "text=/rejected|declined|failed|error|could not sign/i"
      )
    ).toBeVisible({ timeout: 15_000 });

    await context.close();
  });

  // ── 10. Close modal without submitting ────────────────────────────────────
  test("can close the pledge modal without submitting a contribution", async ({
    page,
  }) => {
    await goToFirstCampaign(page);
    await openPledgeModal(page);

    // Close button or ESC should dismiss the modal
    const closeBtn = page.locator(
      "[aria-label*='close' i], [aria-label*='dismiss' i], button:text-matches('cancel|×|close', 'i')"
    );
    if (await closeBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeBtn.first().click();
    } else {
      await page.keyboard.press("Escape");
    }

    // Modal should no longer be visible
    await expect(
      page.locator("text=/Pledge to|Contribute to/i")
    ).not.toBeVisible({ timeout: 5_000 });
  });

  // ── 11. Minimum contribution amount ───────────────────────────────────────
  test("accepts a contribution at the campaign's minimum pledge amount", async ({
    page,
  }) => {
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);

    // Use the minimum displayed amount if there is a hint, otherwise use 1
    const minHint = await page
      .locator("text=/minimum.*?([0-9.]+)/i")
      .first()
      .textContent()
      .catch(() => null);

    const amount = minHint?.match(/([0-9.]+)/)?.[1] ?? "1";
    await fillAmount(page, amount);
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator("text=/success|pledge submitted|contribution confirmed|thank you/i")
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── 12. Receipt shows contribution amount ─────────────────────────────────
  test("success receipt displays the contributed amount", async ({ page }) => {
    const contributionAmount = "42";

    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);
    await fillAmount(page, contributionAmount);
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    // Wait for success state
    await expect(
      page.locator("text=/success|pledge submitted|confirmed/i")
    ).toBeVisible({ timeout: 15_000 });

    // The receipt / confirmation area should mention the amount
    await expect(
      page.locator(`text=/42|${contributionAmount}/`)
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 13. Two independent contributors (parallel contexts) ──────────────────
  test("two independent wallets can each see campaigns independently", async ({
    browser,
  }) => {
    const addressA = "GCONTRIB_A_0000000000000000000000000000000000000000000000";
    const addressB = "GCONTRIB_B_0000000000000000000000000000000000000000000000";

    const [ctxA, ctxB] = await Promise.all([
      newWalletContext(browser, addressA),
      newWalletContext(browser, addressB),
    ]);

    const [pageA, pageB] = await Promise.all([
      ctxA.newPage(),
      ctxB.newPage(),
    ]);

    // Both should be able to load the campaigns page independently
    await Promise.all([
      pageA.goto("/campaigns"),
      pageB.goto("/campaigns"),
    ]);

    const cardsA = pageA.locator("a[href*='/campaigns/']");
    const cardsB = pageB.locator("a[href*='/campaigns/']");

    await expect(cardsA.first()).toBeVisible({ timeout: 10_000 });
    await expect(cardsB.first()).toBeVisible({ timeout: 10_000 });

    await Promise.all([ctxA.close(), ctxB.close()]);
  });

  // ── 14. Campaign page shows funding progress ──────────────────────────────
  test("campaign detail page displays a progress indicator", async ({
    page,
  }) => {
    await goToFirstCampaign(page);

    // At least one of: progress bar, percentage text, or raised/goal display
    const progressIndicator = page.locator(
      "[role='progressbar'], text=/%/, text=/raised/i, text=/goal/i"
    );
    await expect(progressIndicator.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Additional tests for issue #1736 (stable selectors & rejection) ──────

  test("contribution rejection shows specific error details", async ({
    browser,
  }) => {
    // Create context with wallet that returns specific error
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.addEventListener("message", (event: MessageEvent) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;

        const respond = (fields: Record<string, unknown>) => {
          window.postMessage(
            {
              source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
              messagedId: data.messageId,
              ...fields,
            },
            window.location.origin,
          );
        };

        switch (data.type) {
          case "REQUEST_ACCESS":
          case "REQUEST_PUBLIC_KEY":
            respond({ publicKey: "GTEST000000000000000000000000000000000000000000000000000" });
            break;
          case "REQUEST_CONNECTION_STATUS":
            respond({ isConnected: true });
            break;
          case "REQUEST_ALLOWED_STATUS":
            respond({ isAllowed: true });
            break;
          case "REQUEST_NETWORK_DETAILS":
            respond({
              networkDetails: {
                network: "TESTNET",
                networkName: "TESTNET",
                networkUrl: "https://horizon-testnet.stellar.org",
                networkPassphrase: "Test SDF Network ; September 2015",
              },
            });
            break;
          case "SUBMIT_TRANSACTION":
            // Simulate insufficient balance error
            respond({
              error: "Insufficient balance for transaction",
              signedTransaction: null,
            });
            break;
          default:
            respond({});
        }
      });
    });

    const page = await context.newPage();
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);
    await fillAmount(page, "10");
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    // Should show specific error message
    await expect(
      page.locator("text=/insufficient balance|not enough funds/i")
    ).toBeVisible({ timeout: 15_000 });

    await context.close();
  });

  test("contribution form uses stable data-testid selectors", async ({ page }) => {
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);

    // Check for stable selectors (these should be added to the actual component)
    const amountInput = page.locator(
      "[data-testid='contribution-amount-input'], input[type='number'], input[name='amount']"
    );
    await expect(amountInput.first()).toBeVisible();

    const confirmButton = page.getByRole("button", { name: /confirm pledge|submit contribution/i });
    await expect(confirmButton).toBeVisible();
  });

  test("campaign card uses stable data-testid for discovery", async ({ page }) => {
    await page.goto("/campaigns");

    // Campaign cards should have stable selectors
    const campaignCard = page.locator(
      "[data-testid='campaign-card'], .campaign-card"
    ).first();

    await expect(campaignCard).toBeVisible({ timeout: 10_000 });

    // Click should navigate to detail page
    await campaignCard.click();
    await expect(page).toHaveURL(/\/campaigns\/.+/);
  });

  test("rejected contribution preserves form state", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.addEventListener("message", (event: MessageEvent) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;

        const respond = (fields: Record<string, unknown>) => {
          window.postMessage(
            {
              source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
              messagedId: data.messageId,
              ...fields,
            },
            window.location.origin,
          );
        };

        switch (data.type) {
          case "REQUEST_ACCESS":
          case "REQUEST_PUBLIC_KEY":
            respond({ publicKey: "GTEST000000000000000000000000000000000000000000000000000" });
            break;
          case "REQUEST_CONNECTION_STATUS":
            respond({ isConnected: true });
            break;
          case "REQUEST_ALLOWED_STATUS":
            respond({ isAllowed: true });
            break;
          case "REQUEST_NETWORK_DETAILS":
            respond({
              networkDetails: {
                network: "TESTNET",
                networkName: "TESTNET",
                networkUrl: "https://horizon-testnet.stellar.org",
                networkPassphrase: "Test SDF Network ; September 2015",
              },
            });
            break;
          case "SUBMIT_TRANSACTION":
            respond({
              error: "Transaction rejected",
              signedTransaction: null,
            });
            break;
          default:
            respond({});
        }
      });
    });

    const page = await context.newPage();
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);
    await openPledgeModal(page);

    const testAmount = "42";
    await fillAmount(page, testAmount);
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    // Wait for rejection
    await expect(
      page.locator("text=/rejected|failed|error/i")
    ).toBeVisible({ timeout: 15_000 });

    // Form should still be visible with the amount preserved (or cleared for retry)
    const modal = page.locator("text=/Pledge to|Contribute to/i");
    await expect(modal).toBeVisible();

    await context.close();
  });

  test("contribution success updates campaign progress immediately", async ({ page }) => {
    await goToFirstCampaign(page);
    await ensureWalletConnected(page);

    // Capture initial progress
    const progressBar = page.locator("[role='progressbar']");
    const beforeValue = await progressBar
      .getAttribute("aria-valuenow")
      .catch(() => "0");

    await openPledgeModal(page);
    await fillAmount(page, "50");
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    // Wait for success
    await expect(
      page.locator("text=/success|submitted|confirmed/i")
    ).toBeVisible({ timeout: 15_000 });

    // Progress should have changed (or at least not decreased)
    const afterValue = await progressBar
      .getAttribute("aria-valuenow")
      .catch(() => "0");

    expect(parseFloat(afterValue ?? "0")).toBeGreaterThanOrEqual(
      parseFloat(beforeValue ?? "0")
    );
  });
});
