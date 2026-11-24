import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../../../../..");
const canonicalNames = [
  "ApiResponse",
  "ApiError",
  "PaginatedResponse",
  "CampaignResponse",
  "RawCampaignInfo",
  "RawCampaignStats",
  "CampaignStatus",
  "CampaignInfo",
  "ContributionRecord",
  "IndexerEvent",
  "Milestone",
  "Comment",
];
const declarationPattern = new RegExp(
  `\\b(?:interface|type)\\s+(${canonicalNames.join("|")})\\b`,
  "g",
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function listFiles(relativeDir) {
  const absolute = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  return fs
    .readdirSync(absolute)
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => path.join(relativeDir, name));
}

describe("API/contract DTO single source (#1765)", () => {
  it("keeps the canonical DTO declarations in packages/types", () => {
    const source = read("packages/types/src/index.ts");
    expect(source).toContain('from "./api"');
    expect(source).toContain('from "./contract"');
    expect(source).toContain('from "./soroban"');
  });

  it("removes the legacy root src/types duplicate tree", () => {
    expect(fs.existsSync(path.join(repoRoot, "src/types"))).toBe(false);
  });

  it("reuses canonical raw contract shapes in shared-utils mappers", () => {
    const source = read("packages/shared-utils/src/mappers.ts");
    expect(source).toContain('from "@fund-my-cause/types"');
    expect(source).toContain("CanonicalRawCampaignInfo");
    expect(source).toContain("CanonicalRawCampaignStats");
    expect(source).not.toMatch(/\binterface\s+RawCampaignInfo\b/);
    expect(source).not.toMatch(/\binterface\s+RawCampaignStats\b/);
  });

  it("does not redeclare canonical DTOs in the type re-export facades", () => {
    const facades = [
      ...listFiles("apps/interface/src/types"),
      "services/graphql-api/src/types.ts",
      "services/indexer/src/types.ts",
    ].filter((file) => fs.existsSync(path.join(repoRoot, file)));

    expect(facades.length).toBeGreaterThan(0);
    for (const file of facades) {
      const duplicates = [...read(file).matchAll(declarationPattern)].map(
        (match) => match[1],
      );
      expect(duplicates, `${file} redeclares canonical DTOs`).toEqual([]);
    }
  });
});
