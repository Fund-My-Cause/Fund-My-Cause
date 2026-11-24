import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const noMixedNullUndefined = require("../no-mixed-null-undefined.js");
const pascalCaseComponentFiles = require("../pascal-case-component-files.js");

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 2020, sourceType: "module" },
});

ruleTester.run("no-mixed-null-undefined", noMixedNullUndefined, {
  valid: [
    { code: "let value: string | null = null;", filename: "a.ts" },
    { code: "let value: string | undefined;", filename: "a.ts" },
    { code: "let value: Array<string | null>;", filename: "a.ts" },
  ],
  invalid: [
    {
      code: "let value: string | null | undefined;",
      filename: "a.ts",
      errors: 1,
    },
    {
      code: "let value: number | undefined | null;",
      filename: "a.ts",
      errors: 1,
    },
  ],
});

ruleTester.run("pascal-case-component-files", pascalCaseComponentFiles, {
  valid: [
    {
      code: "export const CampaignCard = () => null;",
      filename: "/repo/apps/interface/src/components/CampaignCard.tsx",
    },
    {
      code: "export const CampaignCard = () => null;",
      filename: "/repo/apps/interface/src/components/CampaignCard.test.tsx",
    },
    {
      code: "export const CommandPalette = () => null;",
      filename:
        "/repo/apps/interface/src/components/ui/CommandPalette.keyboard.test.tsx",
    },
    {
      code: "export const helper = () => null;",
      filename: "/repo/apps/interface/src/lib/helper.tsx",
    },
  ],
  invalid: [
    {
      code: "export const CampaignCard = () => null;",
      filename: "/repo/apps/interface/src/components/campaign-card.tsx",
      errors: 1,
    },
    {
      code: "export const CampaignCard = () => null;",
      filename: "/repo/apps/interface/src/components/campaign_card.tsx",
      errors: 1,
    },
  ],
});
