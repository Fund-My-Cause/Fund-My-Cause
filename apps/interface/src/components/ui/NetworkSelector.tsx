"use client";

import React from "react";
import type { StellarNetwork, StellarConfig } from "@/types/stellarConfig";

const NETWORK_OPTIONS: {
  value: StellarNetwork;
  label: string;
  passphrase: string;
}[] = [
  {
    value: "mainnet",
    label: "Mainnet",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
  {
    value: "testnet",
    label: "Testnet",
    passphrase: "Test SDF Network ; September 2015",
  },
  {
    value: "futurenet",
    label: "Futurenet",
    passphrase: "Test SDF Future Network ; October 2022",
  },
  { value: "custom", label: "Custom", passphrase: "" },
];

interface NetworkSelectorProps {
  value: StellarConfig;
  onChange: (next: StellarConfig) => void;
  disabled?: boolean;
  /** Validation message for the custom passphrase field. */
  passphraseError?: string | null;
}

/**
 * Lets the user pick a Stellar network and, for "custom", enter a passphrase.
 */
export const NetworkSelector = ({
  value,
  onChange,
  disabled,
  passphraseError,
}: NetworkSelectorProps) => {
  const handleNetworkChange = (network: StellarNetwork) => {
    const preset = NETWORK_OPTIONS.find((o) => o.value === network);
    onChange({
      ...value,
      network,
      customPassphrase: preset?.passphrase ?? value.customPassphrase,
    });
  };

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-medium text-gray-300">Network</legend>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Stellar network"
      >
        {NETWORK_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={[
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition",
              value.network === opt.value
                ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500",
              disabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name="stellar-network"
              value={opt.value}
              checked={value.network === opt.value}
              onChange={() => handleNetworkChange(opt.value)}
              disabled={disabled}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {value.network === "custom" && (
        <div className="space-y-1">
          <label
            htmlFor="custom-passphrase"
            className="block text-xs text-gray-400"
          >
            Network passphrase
          </label>
          <input
            id="custom-passphrase"
            type="text"
            value={value.customPassphrase}
            onChange={(e) =>
              onChange({ ...value, customPassphrase: e.target.value })
            }
            disabled={disabled}
            placeholder="e.g. My Private Network ; January 2024"
            aria-describedby={passphraseError ? "passphrase-error" : undefined}
            aria-invalid={!!passphraseError}
            className={[
              "w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1",
              passphraseError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-700 focus:ring-indigo-500",
            ].join(" ")}
          />
          {passphraseError && (
            <p
              id="passphrase-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {passphraseError}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
};
