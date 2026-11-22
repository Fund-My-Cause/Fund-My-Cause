import { describe, it, expect } from "vitest";

import { Button } from "../Button.entry";
import { Input } from "../Input.entry";
import { Modal } from "../Modal.entry";
import { Card, CardHeader, CardBody, CardFooter } from "../Card.entry";
import { ProgressBar } from "../ProgressBar.entry";
import { FormField } from "../FormField.entry";
import { Select } from "../Select.entry";
import { Textarea } from "../Textarea.entry";
import { CampaignHeader } from "../CampaignHeader.entry";
import { CampaignProgress } from "../CampaignProgress.entry";
import { CampaignActions } from "../CampaignActions.entry";
import * as library from "../index";

describe("tree-shaking: per-component imports", () => {
  it("should export Button from button entry point", () => {
    expect(Button).toBeDefined();
  });

  it("should export Input from input entry point", () => {
    expect(Input).toBeDefined();
  });

  it("should export Modal from modal entry point", () => {
    expect(Modal).toBeDefined();
  });

  it("should export Card components from card entry point", () => {
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardBody).toBeDefined();
    expect(CardFooter).toBeDefined();
  });

  it("should export ProgressBar from progress-bar entry point", () => {
    expect(ProgressBar).toBeDefined();
  });

  it("should export FormField from form-field entry point", () => {
    expect(FormField).toBeDefined();
  });

  it("should export Select from select entry point", () => {
    expect(Select).toBeDefined();
  });

  it("should export Textarea from textarea entry point", () => {
    expect(Textarea).toBeDefined();
  });

  it("should export CampaignHeader from campaign-header entry point", () => {
    expect(CampaignHeader).toBeDefined();
  });

  it("should export CampaignProgress from campaign-progress entry point", () => {
    expect(CampaignProgress).toBeDefined();
  });

  it("should export CampaignActions from campaign-actions entry point", () => {
    expect(CampaignActions).toBeDefined();
  });

  it("should allow importing entire library from index", () => {
    expect(library.Button).toBeDefined();
    expect(library.Input).toBeDefined();
    expect(library.Modal).toBeDefined();
    expect(library.Card).toBeDefined();
    expect(library.ProgressBar).toBeDefined();
    expect(library.FormField).toBeDefined();
    expect(library.Select).toBeDefined();
    expect(library.Textarea).toBeDefined();
    expect(library.CampaignHeader).toBeDefined();
    expect(library.CampaignProgress).toBeDefined();
    expect(library.CampaignActions).toBeDefined();
    expect(library.cn).toBeDefined();
  });
});
