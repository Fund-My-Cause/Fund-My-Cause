/**
 * Field-level validation helpers for the Stellar configuration panel.
 */

import type {
  StellarConfig,
  StellarNetwork,
  StellarAsset,
  AssetPair,
  FieldValidation,
  StellarConfigValidation,
} from "@/types/stellarConfig";

const VALID: FieldValidation = { valid: true, message: null };

/** Stellar contract IDs start with 'C' and are 56 base32 characters. */
export function validateContractId(
  id: string,
  required = true,
): FieldValidation {
  if (!id || !id.trim()) {
    return required
      ? { valid: false, message: "Contract ID is required." }
      : VALID;
  }
  if (!id.startsWith("C") || id.length !== 56) {
    return {
      valid: false,
      message: "Contract ID must start with 'C' and be 56 characters.",
    };
  }
  if (!/^C[A-Z2-7]{55}$/.test(id)) {
    return {
      valid: false,
      message: "Contract ID contains invalid characters.",
    };
  }
  return VALID;
}

/** Stellar account IDs start with 'G' and are 56 base32 characters. */
export function validateAccountId(
  id: string,
  required = true,
): FieldValidation {
  if (!id || !id.trim()) {
    return required
      ? { valid: false, message: "Account ID is required." }
      : VALID;
  }
  if (!id.startsWith("G") || id.length !== 56) {
    return {
      valid: false,
      message: "Account ID must start with 'G' and be 56 characters.",
    };
  }
  if (!/^G[A-Z2-7]{55}$/.test(id)) {
    return { valid: false, message: "Account ID contains invalid characters." };
  }
  return VALID;
}

/** Validates a URL (must be https or http). */
export function validateUrl(url: string, required = true): FieldValidation {
  if (!url || !url.trim()) {
    return required ? { valid: false, message: "URL is required." } : VALID;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, message: "URL must use http or https." };
    }
    return VALID;
  } catch {
    return { valid: false, message: "Invalid URL format." };
  }
}

/** Validates a Stellar asset code (1–12 alphanumeric characters). */
export function validateAssetCode(code: string): FieldValidation {
  if (!code || !code.trim()) {
    return { valid: false, message: "Asset code is required." };
  }
  if (!/^[A-Za-z0-9]{1,12}$/.test(code)) {
    return {
      valid: false,
      message: "Asset code must be 1–12 alphanumeric characters.",
    };
  }
  return VALID;
}

/** Validates a single StellarAsset. Native XLM has no issuer. */
export function validateAsset(asset: StellarAsset): FieldValidation {
  const codeResult = validateAssetCode(asset.code);
  if (!codeResult.valid) return codeResult;

  const isNative = asset.code.toUpperCase() === "XLM" && !asset.issuer;
  if (!isNative && asset.issuer) {
    return validateAccountId(asset.issuer);
  }
  if (!isNative && !asset.issuer) {
    return {
      valid: false,
      message: "Non-native assets require an issuer account ID.",
    };
  }
  return VALID;
}

/** Validates an AssetPair (base and quote must be valid and different). */
export function validateAssetPair(pair: AssetPair): FieldValidation {
  const baseResult = validateAsset(pair.base);
  if (!baseResult.valid)
    return { valid: false, message: `Base asset: ${baseResult.message}` };

  const quoteResult = validateAsset(pair.quote);
  if (!quoteResult.valid)
    return { valid: false, message: `Quote asset: ${quoteResult.message}` };

  const baseKey = `${pair.base.code}:${pair.base.issuer}`;
  const quoteKey = `${pair.quote.code}:${pair.quote.issuer}`;
  if (baseKey === quoteKey) {
    return {
      valid: false,
      message: "Base and quote assets must be different.",
    };
  }
  return VALID;
}

/** Validates the custom network passphrase (required only for "custom" network). */
export function validateCustomPassphrase(
  passphrase: string,
  network: StellarNetwork,
): FieldValidation {
  if (network !== "custom") return VALID;
  if (!passphrase || !passphrase.trim()) {
    return { valid: false, message: "Custom network passphrase is required." };
  }
  return VALID;
}

/** Validates the entire StellarConfig and returns per-field results. */
export function validateStellarConfig(
  config: StellarConfig,
): StellarConfigValidation {
  return {
    network: VALID,
    customPassphrase: validateCustomPassphrase(
      config.customPassphrase,
      config.network,
    ),
    rpcUrl: validateUrl(config.rpcUrl),
    horizonUrl: validateUrl(config.horizonUrl),
    contractId: validateContractId(config.contractId),
    registryContractId: validateContractId(config.registryContractId, false),
    assetPair: validateAssetPair(config.assetPair),
  };
}

/** Returns true if all fields in a StellarConfigValidation are valid. */
export function isStellarConfigValid(
  validation: StellarConfigValidation,
): boolean {
  return Object.values(validation).every((v) => v.valid);
}
