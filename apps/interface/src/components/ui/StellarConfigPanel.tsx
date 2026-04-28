"use client";

import React, { useState, useCallback } from "react";
import { Save } from "lucide-react";
import type {
  StellarConfig,
  StellarConfigPanelProps,
} from "@/types/stellarConfig";
import {
  validateStellarConfig,
  isStellarConfigValid,
} from "@/lib/stellarConfigValidation";
import { NetworkSelector } from "@/components/ui/NetworkSelector";
import { AssetPairEditor } from "@/components/ui/AssetPairEditor";
import { ContractAddressInput } from "@/components/ui/ContractAddressInput";
import { HorizonUrlInput } from "@/components/ui/HorizonUrlInput";

/** Default configuration used when no value is provided. */
export const DEFAULT_STELLAR_CONFIG: StellarConfig = {
  network: "testnet",
  customPassphrase: "",
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  contractId: "",
  registryContractId: "",
  assetPair: {
    base: { code: "XLM", issuer: "" },
    quote: {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    },
  },
};

/**
 * Composite panel for configuring Stellar network, contracts, and assets.
 * Validates all fields inline and calls onSave only when the config is valid.
 */
export const StellarConfigPanel = ({
  value,
  onChange,
  onSave,
  disabled,
}: StellarConfigPanelProps) => {
  const [touched, setTouched] = useState(false);

  const validation = validateStellarConfig(value);
  const isValid = isStellarConfigValid(validation);

  const handleChange = useCallback(
    (next: StellarConfig) => {
      setTouched(true);
      onChange(next);
    },
    [onChange],
  );

  const handleSave = () => {
    setTouched(true);
    if (isValid) onSave?.(value);
  };

  // Only show errors after the user has interacted with the form
  const err = touched ? validation : null;

  return (
    <section
      aria-label="Stellar configuration"
      className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900 p-6"
    >
      <header>
        <h2 className="text-base font-semibold text-white">
          Stellar Configuration
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Configure the network, contracts, and asset pair for this campaign.
        </p>
      </header>

      {/* Network */}
      <NetworkSelector
        value={value}
        onChange={handleChange}
        disabled={disabled}
        passphraseError={err?.customPassphrase.message}
      />

      {/* RPC URL */}
      <div className="space-y-1">
        <label
          htmlFor="rpc-url"
          className="block text-sm font-medium text-gray-300"
        >
          Soroban RPC URL{" "}
          <span aria-hidden="true" className="text-red-400">
            *
          </span>
        </label>
        <input
          id="rpc-url"
          type="url"
          value={value.rpcUrl}
          onChange={(e) =>
            handleChange({ ...value, rpcUrl: e.target.value.trim() })
          }
          disabled={disabled}
          placeholder="https://soroban-testnet.stellar.org"
          aria-describedby={err?.rpcUrl.message ? "rpc-url-error" : undefined}
          aria-invalid={!!err?.rpcUrl.message}
          className={[
            "w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 disabled:opacity-50",
            err?.rpcUrl.message
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-700 focus:ring-indigo-500",
          ].join(" ")}
        />
        {err?.rpcUrl.message && (
          <p id="rpc-url-error" role="alert" className="text-xs text-red-400">
            {err.rpcUrl.message}
          </p>
        )}
      </div>

      {/* Horizon URL */}
      <HorizonUrlInput
        id="horizon-url"
        label="Horizon URL"
        value={value.horizonUrl}
        onChange={(horizonUrl) => handleChange({ ...value, horizonUrl })}
        disabled={disabled}
        error={err?.horizonUrl.message}
      />

      {/* Contract addresses */}
      <div className="space-y-4">
        <ContractAddressInput
          id="contract-id"
          label="Crowdfund Contract ID"
          value={value.contractId}
          onChange={(contractId) => handleChange({ ...value, contractId })}
          disabled={disabled}
          required
          error={err?.contractId.message}
          hint="The deployed Soroban crowdfund contract address."
        />

        <ContractAddressInput
          id="registry-contract-id"
          label="Registry Contract ID"
          value={value.registryContractId}
          onChange={(registryContractId) =>
            handleChange({ ...value, registryContractId })
          }
          disabled={disabled}
          error={err?.registryContractId.message}
          hint="Optional. The campaign registry contract address."
        />
      </div>

      {/* Asset pair */}
      <AssetPairEditor
        value={value.assetPair}
        onChange={(assetPair) => handleChange({ ...value, assetPair })}
        disabled={disabled}
        error={err?.assetPair.message}
      />

      {/* Save */}
      {onSave && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={disabled || (touched && !isValid)}
            aria-label="Save Stellar configuration"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={15} aria-hidden="true" />
            Save Configuration
          </button>
        </div>
      )}
    </section>
  );
};
