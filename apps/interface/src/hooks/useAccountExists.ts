"use client";

import { useState, useEffect } from "react";
import { Horizon } from "@stellar/stellar-sdk";

const SERVER_URL = "https://horizon-testnet.stellar.org";

interface AccountExistsResult {
  exists: boolean;
  loading: boolean;
}

/**
 * Checks whether a Stellar account is funded (exists on the network)
 * using the Horizon API. Returns { exists, loading }.
 *
 * When address is null (wallet not connected), both flags are false.
 * Uses the same Horizon.Server + loadAccount() pattern as soroban.ts.
 */
export function useAccountExists(address: string | null): AccountExistsResult {
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setExists(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const server = new Horizon.Server(SERVER_URL);
    server
      .loadAccount(address)
      .then(() => {
        if (!cancelled) {
          setExists(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExists(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return { exists, loading };
}
