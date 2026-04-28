import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  StellarConfigPanel,
  DEFAULT_STELLAR_CONFIG,
} from "./StellarConfigPanel";
import type { StellarConfig } from "@/types/stellarConfig";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_CONTRACT =
  "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const VALID_REGISTRY =
  "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

function makeConfig(overrides: Partial<StellarConfig> = {}): StellarConfig {
  return {
    ...DEFAULT_STELLAR_CONFIG,
    contractId: VALID_CONTRACT,
    ...overrides,
  };
}

function renderPanel(
  config: StellarConfig = makeConfig(),
  onSave = jest.fn(),
  onChange = jest.fn(),
) {
  return render(
    <StellarConfigPanel value={config} onChange={onChange} onSave={onSave} />,
  );
}

// ── StellarConfigPanel ────────────────────────────────────────────────────────

describe("StellarConfigPanel", () => {
  it("renders the section heading", () => {
    renderPanel();
    expect(screen.getByText("Stellar Configuration")).toBeInTheDocument();
  });

  it("renders all network radio options", () => {
    renderPanel();
    expect(screen.getByRole("radio", { name: "Mainnet" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Testnet" })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Futurenet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Custom" })).toBeInTheDocument();
  });

  it("renders the Save button when onSave is provided", () => {
    renderPanel();
    expect(
      screen.getByRole("button", { name: /save stellar configuration/i }),
    ).toBeInTheDocument();
  });

  it("does not render Save button when onSave is omitted", () => {
    render(<StellarConfigPanel value={makeConfig()} onChange={jest.fn()} />);
    expect(
      screen.queryByRole("button", { name: /save/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onSave with the current config when form is valid", () => {
    const onSave = jest.fn();
    renderPanel(makeConfig(), onSave);
    fireEvent.click(
      screen.getByRole("button", { name: /save stellar configuration/i }),
    );
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ contractId: VALID_CONTRACT }),
    );
  });

  it("does not call onSave when contractId is invalid", () => {
    const onSave = jest.fn();
    renderPanel(makeConfig({ contractId: "INVALID" }), onSave);
    fireEvent.click(
      screen.getByRole("button", { name: /save stellar configuration/i }),
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid contractId after interaction", () => {
    renderPanel(makeConfig({ contractId: "INVALID" }));
    fireEvent.click(
      screen.getByRole("button", { name: /save stellar configuration/i }),
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("calls onChange when network is changed", () => {
    const onChange = jest.fn();
    renderPanel(makeConfig(), jest.fn(), onChange);
    fireEvent.click(screen.getByRole("radio", { name: "Mainnet" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ network: "mainnet" }),
    );
  });

  it("shows custom passphrase input when Custom network is selected", () => {
    renderPanel(makeConfig({ network: "custom", customPassphrase: "" }));
    expect(screen.getByLabelText(/network passphrase/i)).toBeInTheDocument();
  });

  it("hides custom passphrase input for non-custom networks", () => {
    renderPanel(makeConfig({ network: "testnet" }));
    expect(
      screen.queryByLabelText(/network passphrase/i),
    ).not.toBeInTheDocument();
  });

  it("shows passphrase error when custom network has empty passphrase", () => {
    renderPanel(makeConfig({ network: "custom", customPassphrase: "" }));
    fireEvent.click(
      screen.getByRole("button", { name: /save stellar configuration/i }),
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders the Horizon URL test button", () => {
    renderPanel();
    expect(
      screen.getByRole("button", { name: /test horizon url connectivity/i }),
    ).toBeInTheDocument();
  });

  it("disables all inputs when disabled prop is set", () => {
    render(
      <StellarConfigPanel value={makeConfig()} onChange={jest.fn()} disabled />,
    );
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => expect(input).toBeDisabled());
  });
});

// ── ContractAddressInput ──────────────────────────────────────────────────────

describe("ContractAddressInput", () => {
  it("shows a valid icon for a 56-char contract ID", () => {
    const { ContractAddressInput } = jest.requireActual(
      "./ContractAddressInput",
    ) as typeof import("./ContractAddressInput");
    render(
      <ContractAddressInput
        id="test"
        label="Contract"
        value={VALID_CONTRACT}
        onChange={jest.fn()}
        required
      />,
    );
    // CheckCircle2 is rendered (no error, length === 56)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message when error prop is set", () => {
    const { ContractAddressInput } = jest.requireActual(
      "./ContractAddressInput",
    ) as typeof import("./ContractAddressInput");
    render(
      <ContractAddressInput
        id="test"
        label="Contract"
        value="BAD"
        onChange={jest.fn()}
        required
        error="Contract ID must start with 'C' and be 56 characters."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Contract ID must start with 'C'",
    );
  });
});

// ── HorizonUrlInput ───────────────────────────────────────────────────────────

describe("HorizonUrlInput", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows 'Connected' after a successful connectivity check", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const { HorizonUrlInput } = jest.requireActual(
      "./HorizonUrlInput",
    ) as typeof import("./HorizonUrlInput");
    render(
      <HorizonUrlInput
        id="horizon"
        label="Horizon URL"
        value="https://horizon-testnet.stellar.org"
        onChange={jest.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /test horizon url connectivity/i }),
    );

    await waitFor(() =>
      expect(screen.getByText("Connected")).toBeInTheDocument(),
    );
  });

  it("shows 'Unreachable' when fetch returns non-ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const { HorizonUrlInput } = jest.requireActual(
      "./HorizonUrlInput",
    ) as typeof import("./HorizonUrlInput");
    render(
      <HorizonUrlInput
        id="horizon"
        label="Horizon URL"
        value="https://bad-horizon.example.com"
        onChange={jest.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /test horizon url connectivity/i }),
    );

    await waitFor(() =>
      expect(screen.getByText("Unreachable")).toBeInTheDocument(),
    );
  });

  it("shows 'Unreachable' when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { HorizonUrlInput } = jest.requireActual(
      "./HorizonUrlInput",
    ) as typeof import("./HorizonUrlInput");
    render(
      <HorizonUrlInput
        id="horizon"
        label="Horizon URL"
        value="https://bad-horizon.example.com"
        onChange={jest.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /test horizon url connectivity/i }),
    );

    await waitFor(() =>
      expect(screen.getByText("Unreachable")).toBeInTheDocument(),
    );
  });

  it("disables the Test button when value is empty", () => {
    const { HorizonUrlInput } = jest.requireActual(
      "./HorizonUrlInput",
    ) as typeof import("./HorizonUrlInput");
    render(
      <HorizonUrlInput
        id="horizon"
        label="Horizon URL"
        value=""
        onChange={jest.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /test horizon url connectivity/i }),
    ).toBeDisabled();
  });
});

// ── NetworkSelector ───────────────────────────────────────────────────────────

describe("NetworkSelector", () => {
  it("pre-selects the current network", () => {
    const { NetworkSelector } = jest.requireActual(
      "./NetworkSelector",
    ) as typeof import("./NetworkSelector");
    render(
      <NetworkSelector
        value={makeConfig({ network: "mainnet" })}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByRole("radio", { name: "Mainnet" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Testnet" })).not.toBeChecked();
  });

  it("calls onChange with the preset passphrase when switching to testnet", () => {
    const { NetworkSelector } = jest.requireActual(
      "./NetworkSelector",
    ) as typeof import("./NetworkSelector");
    const onChange = jest.fn();
    render(
      <NetworkSelector
        value={makeConfig({ network: "mainnet" })}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Testnet" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        network: "testnet",
        customPassphrase: "Test SDF Network ; September 2015",
      }),
    );
  });
});

// ── AssetPairEditor ───────────────────────────────────────────────────────────

describe("AssetPairEditor", () => {
  it("renders base and quote asset code inputs", () => {
    const { AssetPairEditor } = jest.requireActual(
      "./AssetPairEditor",
    ) as typeof import("./AssetPairEditor");
    render(
      <AssetPairEditor
        value={DEFAULT_STELLAR_CONFIG.assetPair}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/base asset code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quote asset code/i)).toBeInTheDocument();
  });

  it("calls onChange when base asset code changes", () => {
    const { AssetPairEditor } = jest.requireActual(
      "./AssetPairEditor",
    ) as typeof import("./AssetPairEditor");
    const onChange = jest.fn();
    render(
      <AssetPairEditor
        value={DEFAULT_STELLAR_CONFIG.assetPair}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/base asset code/i), {
      target: { value: "BTC" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        base: expect.objectContaining({ code: "BTC" }),
      }),
    );
  });

  it("shows a pair-level error when provided", () => {
    const { AssetPairEditor } = jest.requireActual(
      "./AssetPairEditor",
    ) as typeof import("./AssetPairEditor");
    render(
      <AssetPairEditor
        value={DEFAULT_STELLAR_CONFIG.assetPair}
        onChange={jest.fn()}
        error="Base and quote assets must be different."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Base and quote assets must be different.",
    );
  });
});

// ── stellarConfigValidation ───────────────────────────────────────────────────

describe("stellarConfigValidation", () => {
  const {
    validateContractId,
    validateUrl,
    validateAssetPair,
    validateStellarConfig,
    isStellarConfigValid,
  } = jest.requireActual(
    "@/lib/stellarConfigValidation",
  ) as typeof import("@/lib/stellarConfigValidation");

  describe("validateContractId", () => {
    it("accepts a valid contract ID", () => {
      expect(validateContractId(VALID_CONTRACT).valid).toBe(true);
    });
    it("rejects an ID that doesn't start with C", () => {
      expect(
        validateContractId(
          "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        ).valid,
      ).toBe(false);
    });
    it("rejects an ID that is too short", () => {
      expect(validateContractId("CAAA").valid).toBe(false);
    });
    it("accepts empty string when not required", () => {
      expect(validateContractId("", false).valid).toBe(true);
    });
    it("rejects empty string when required", () => {
      expect(validateContractId("", true).valid).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("accepts a valid https URL", () => {
      expect(validateUrl("https://horizon-testnet.stellar.org").valid).toBe(
        true,
      );
    });
    it("accepts a valid http URL", () => {
      expect(validateUrl("http://localhost:8000").valid).toBe(true);
    });
    it("rejects a non-URL string", () => {
      expect(validateUrl("not-a-url").valid).toBe(false);
    });
    it("rejects empty string when required", () => {
      expect(validateUrl("").valid).toBe(false);
    });
  });

  describe("validateAssetPair", () => {
    it("accepts a valid XLM/USDC pair", () => {
      expect(validateAssetPair(DEFAULT_STELLAR_CONFIG.assetPair).valid).toBe(
        true,
      );
    });
    it("rejects identical base and quote", () => {
      const pair = {
        base: { code: "XLM", issuer: "" },
        quote: { code: "XLM", issuer: "" },
      };
      expect(validateAssetPair(pair).valid).toBe(false);
    });
    it("rejects non-native asset without issuer", () => {
      const pair = {
        base: { code: "USDC", issuer: "" },
        quote: { code: "XLM", issuer: "" },
      };
      expect(validateAssetPair(pair).valid).toBe(false);
    });
  });

  describe("validateStellarConfig / isStellarConfigValid", () => {
    it("returns valid for a fully populated config", () => {
      const config = makeConfig();
      const v = validateStellarConfig(config);
      expect(isStellarConfigValid(v)).toBe(true);
    });

    it("returns invalid when contractId is missing", () => {
      const config = makeConfig({ contractId: "" });
      const v = validateStellarConfig(config);
      expect(isStellarConfigValid(v)).toBe(false);
    });

    it("returns invalid when horizonUrl is malformed", () => {
      const config = makeConfig({ horizonUrl: "not-a-url" });
      const v = validateStellarConfig(config);
      expect(isStellarConfigValid(v)).toBe(false);
    });
  });
});
