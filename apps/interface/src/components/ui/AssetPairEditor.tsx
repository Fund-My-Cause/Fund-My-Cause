"use client";

import React from "react";
import type { AssetPair, StellarAsset } from "@/types/stellarConfig";

export interface AssetPairEditorProps {
  value: AssetPair;
  onChange: (next: AssetPair) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Edits a base/quote asset pair for contribution denomination.
 */
export const AssetPairEditor = ({
  value,
  onChange,
  disabled,
  error,
}: AssetPairEditorProps) => {
  const baseIsNative =
    value.base.code.toUpperCase() === "XLM" && !value.base.issuer;
  const quoteIsNative =
    value.quote.code.toUpperCase() === "XLM" && !value.quote.issuer;

  const updateBase = (patch: Partial<StellarAsset>) =>
    onChange({ ...value, base: { ...value.base, ...patch } });
  const updateQuote = (patch: Partial<StellarAsset>) =>
    onChange({ ...value, quote: { ...value.quote, ...patch } });

  const inputCls =
    "w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 border-gray-700 focus:ring-indigo-500";
  const monoInputCls =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs";

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-sm font-medium text-gray-300">Asset Pair</legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Base asset */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Base
          </p>
          <label htmlFor="asset-base-code" className="sr-only">
            Base asset code
          </label>
          <input
            id="asset-base-code"
            type="text"
            value={value.base.code}
            onChange={(e) => updateBase({ code: e.target.value.toUpperCase() })}
            disabled={disabled}
            placeholder="e.g. XLM or USDC"
            maxLength={12}
            aria-label="Base asset code"
            className={inputCls}
          />
          {!baseIsNative && (
            <>
              <label htmlFor="asset-base-issuer" className="sr-only">
                Base issuer account ID
              </label>
              <input
                id="asset-base-issuer"
                type="text"
                value={value.base.issuer}
                onChange={(e) => updateBase({ issuer: e.target.value.trim() })}
                disabled={disabled}
                placeholder="Issuer account ID (G…)"
                maxLength={56}
                aria-label="Base issuer account ID"
                className={monoInputCls}
              />
            </>
          )}
        </div>

        {/* Quote asset */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Quote
          </p>
          <label htmlFor="asset-quote-code" className="sr-only">
            Quote asset code
          </label>
          <input
            id="asset-quote-code"
            type="text"
            value={value.quote.code}
            onChange={(e) =>
              updateQuote({ code: e.target.value.toUpperCase() })
            }
            disabled={disabled}
            placeholder="e.g. XLM or USDC"
            maxLength={12}
            aria-label="Quote asset code"
            className={inputCls}
          />
          {!quoteIsNative && (
            <>
              <label htmlFor="asset-quote-issuer" className="sr-only">
                Quote issuer account ID
              </label>
              <input
                id="asset-quote-issuer"
                type="text"
                value={value.quote.issuer}
                onChange={(e) => updateQuote({ issuer: e.target.value.trim() })}
                disabled={disabled}
                placeholder="Issuer account ID (G…)"
                maxLength={56}
                aria-label="Quote issuer account ID"
                className={monoInputCls}
              />
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
};
