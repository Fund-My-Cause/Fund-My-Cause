import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../Button";
import { CampaignActions } from "../CampaignActions";
import { CampaignHeader } from "../CampaignHeader";
import { CampaignProgress } from "../CampaignProgress";
import { Card, CardBody, CardHeader } from "../Card";
import { FormField } from "../FormField";
import { Modal } from "../Modal";
import { ProgressBar } from "../ProgressBar";

describe("component behavior", () => {
  it("exposes the button label to assistive technology", () => {
    render(<Button>Donate</Button>);

    expect(screen.getByRole("button", { name: "Donate" })).toBeDefined();
  });

  it("reports progress through its accessible value", () => {
    render(<ProgressBar progress={65} />);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "65",
    );
  });

  it("associates a FormField label with its control", () => {
    render(
      <FormField label="Campaign title">
        {(controlProps) => <input {...controlProps} />}
      </FormField>,
    );

    expect(screen.getByLabelText("Campaign title")).toBeDefined();
  });

  it("renders card content", () => {
    render(
      <Card>
        <CardHeader>Campaign</CardHeader>
        <CardBody>Support the project</CardBody>
      </Card>,
    );

    expect(screen.getByText("Support the project")).toBeDefined();
  });

  it("names an open modal with its title", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Confirm donation">
        Continue?
      </Modal>,
    );

    expect(
      screen.getByRole("dialog", { name: "Confirm donation" }),
    ).toBeDefined();
  });

  it("renders the campaign title as a heading", () => {
    render(<CampaignHeader title="Community garden" />);

    expect(
      screen.getByRole("heading", { name: "Community garden" }),
    ).toBeDefined();
  });

  it("exposes campaign progress as a progress bar", () => {
    render(<CampaignProgress percent={45} />);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "45",
    );
  });

  it("renders the configured donate action", () => {
    render(
      <CampaignActions onDonate={vi.fn()} donateLabel="Donate now" />,
    );

    expect(screen.getByRole("button", { name: "Donate now" })).toBeDefined();
  });
});
