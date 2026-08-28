/**
 * Unit tests for slugs.ts
 *
 * slugify, buildSlugRegistry, resolveCampaignSlug, getCampaignSlug, getAllSlugs
 *
 * NOTE: resolveCampaignSlug, getCampaignSlug, and getAllSlugs rely on the
 * singleton registry built from ALL_CAMPAIGNS (mocked via @/lib/campaigns).
 * The mock lives at src/__mocks__/lib/campaigns.ts (or campaigns is resolved
 * through @/lib/constants mock — see jest.config.mjs). We import the
 * individually-exported pure functions and test them directly where possible,
 * and reset the module between tests that touch the singleton.
 */

import { slugify, buildSlugRegistry } from "../slugs";

// ── slugify ───────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases the input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("clean water project")).toBe("clean-water-project");
  });

  it("removes special characters", () => {
    expect(slugify("Eco-Friendly Water Purification!")).toBe(
      "eco-friendly-water-purification",
    );
  });

  it("strips accented characters", () => {
    expect(slugify("Résumé café")).toBe("resume-cafe");
  });

  it("collapses multiple spaces into one hyphen", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("collapses multiple hyphens into one", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("removes trailing hyphens", () => {
    expect(slugify("hello world!")).toBe("hello-world");
  });

  it("truncates to 80 characters", () => {
    const longTitle = "a".repeat(100);
    expect(slugify(longTitle).length).toBeLessThanOrEqual(80);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers in the title", () => {
    expect(slugify("Campaign 123")).toBe("campaign-123");
  });

  it("handles a title with only special characters", () => {
    expect(slugify("!!!###")).toBe("");
  });

  it("handles unicode characters beyond accents", () => {
    // Chinese characters are not in a-z0-9\s-, so they get stripped
    expect(slugify("hello 世界")).toBe("hello");
  });
});

// ── buildSlugRegistry ─────────────────────────────────────────────────────────

describe("buildSlugRegistry", () => {
  it("builds a simple registry from unique titles", () => {
    const campaigns = [
      { id: "1", title: "Clean Water" },
      { id: "2", title: "Solar Energy" },
    ];
    const registry = buildSlugRegistry(campaigns);
    expect(registry).toEqual([
      { slug: "clean-water", campaignId: "1" },
      { slug: "solar-energy", campaignId: "2" },
    ]);
  });

  it("deduplicates identical titles with numeric suffixes", () => {
    const campaigns = [
      { id: "1", title: "My Campaign" },
      { id: "2", title: "My Campaign" },
      { id: "3", title: "My Campaign" },
    ];
    const registry = buildSlugRegistry(campaigns);
    expect(registry[0]).toEqual({ slug: "my-campaign", campaignId: "1" });
    expect(registry[1]).toEqual({ slug: "my-campaign-2", campaignId: "2" });
    expect(registry[2]).toEqual({ slug: "my-campaign-3", campaignId: "3" });
  });

  it("only adds suffix to collisions — non-colliding titles stay clean", () => {
    const campaigns = [
      { id: "1", title: "Unique Title" },
      { id: "2", title: "Duplicate" },
      { id: "3", title: "Duplicate" },
    ];
    const registry = buildSlugRegistry(campaigns);
    expect(registry[0].slug).toBe("unique-title");
    expect(registry[1].slug).toBe("duplicate");
    expect(registry[2].slug).toBe("duplicate-2");
  });

  it("returns an empty array for empty input", () => {
    expect(buildSlugRegistry([])).toEqual([]);
  });

  it("handles a single campaign", () => {
    const registry = buildSlugRegistry([{ id: "x", title: "Solo Campaign" }]);
    expect(registry).toEqual([{ slug: "solo-campaign", campaignId: "x" }]);
  });

  it("correctly maps campaignId to slug", () => {
    const campaigns = [{ id: "abc-123", title: "Water For All" }];
    const registry = buildSlugRegistry(campaigns);
    expect(registry[0].campaignId).toBe("abc-123");
    expect(registry[0].slug).toBe("water-for-all");
  });
});
