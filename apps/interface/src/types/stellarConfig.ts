/**
 * Data contracts for the Stellar configuration panel.
 * Used by the customization studio to configure network, assets, and contracts.
 */

/** Supported Stellar network identifiers. */
export type StellarNetwork = "mainnet" | "testnet" | "futurenet" | "custom";

/** A Stellar asset (native XLM or issued token). */
export interface StellarAsset {
  /** Asset code, e.g. "XLM" or "USDC". */
  code: string;
  /** Issuer account ID (G…). Empty string for native XLM. */
  issuer: string;
}

/** An asset pair used for contribution denomination. */
export interface AssetPair {
  base: StellarAsset;
  quote: StellarAsset;
}

/** Full Stellar configuration for the customization studio. */
export interface StellarConfig {
  network: StellarNetwork;
  /** Custom network passphrase (only used when network === "custom"). */
  customPassphrase: string;
  /** Soroban RPC endpoint URL. */
  rpcUrl: string;
  /** Horizon REST API endpoint URL. */
  horizonUrl: string;
  /** Crowdfund contract address (C…, 56 chars). */
  contractId: string;
  /** Registry contract address (C…, 56 chars). Optional. */
  registryContractId: string;
  /** Asset pair for contribution denomination. */
  assetPair: AssetPair;
}

/** Validation state for a single field. */
export interface FieldValidation {
  valid: boolean;
  message: string | null;
}

/** Validation state for the entire StellarConfig form. */
export interface StellarConfigValidation {
  network: FieldValidation;
  customPassphrase: FieldValidation;
  rpcUrl: FieldValidation;
  horizonUrl: FieldValidation;
  contractId: FieldValidation;
  registryContractId: FieldValidation;
  assetPair: FieldValidation;
}

/** Async connectivity check result for a URL. */
export type ConnectivityStatus = "idle" | "checking" | "ok" | "error";

/** Props shared by all sub-components of the config panel. */
export interface StellarConfigPanelProps {
  value: StellarConfig;
  onChange: (next: StellarConfig) => void;
  /** Called when the user explicitly saves the configuration. */
  onSave?: (config: StellarConfig) => void;
  disabled?: boolean;
}
