"use client";

import React, { useState, useRef, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Wifi } from "lucide-react";
import type { ConnectivityStatus } from "@/types/stellarConfig";

/** Checks Horizon connectivity by fetching /fee_stats (lightweight endpoint). */
async function checkHorizonConnectivity(url: string): Promise<boolean> {
  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/fee_stats`, {
    method: "GET",
    signal: AbortSignal.timeout(8000),
  });
  return res.ok;
}

interface HorizonUrlInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * URL input for a Horizon endpoint with an async "Test connection" button.
 * Shows idle / checking / ok / error connectivity states.
 */
export const HorizonUrlInput = ({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
}: HorizonUrlInputProps) => {
  const [status, setStatus] = useState<ConnectivityStatus>("idle");
  const [connectError, setConnectError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleTest = useCallback(async () => {
    if (!value) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus("checking");
    setConnectError(null);

    try {
      const ok = await checkHorizonConnectivity(value);
      setStatus(ok ? "ok" : "error");
      if (!ok) setConnectError("Horizon returned a non-OK response.");
    } catch (err) {
      setStatus("error");
      setConnectError(
        err instanceof Error && err.name !== "AbortError"
          ? err.message
          : "Could not reach Horizon endpoint.",
      );
    }
  }, [value]);

  const statusIcon = {
    idle: null,
    checking: (
      <Loader2
        size={14}
        className="animate-spin text-gray-400"
        aria-hidden="true"
      />
    ),
    ok: (
      <CheckCircle2 size={14} className="text-green-400" aria-hidden="true" />
    ),
    error: <XCircle size={14} className="text-red-400" aria-hidden="true" />,
  }[status];

  const statusLabel = {
    idle: "",
    checking: "Checking…",
    ok: "Connected",
    error: "Unreachable",
  }[status];

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value.trim());
            setStatus("idle");
            setConnectError(null);
          }}
          disabled={disabled}
          placeholder="https://horizon-testnet.stellar.org"
          aria-describedby={
            [
              error ? `${id}-error` : null,
              connectError ? `${id}-connect-error` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={!!error}
          className={[
            "flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 disabled:opacity-50",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-700 focus:ring-indigo-500",
          ].join(" ")}
        />

        <button
          type="button"
          onClick={handleTest}
          disabled={disabled || !value || status === "checking"}
          aria-label={`Test ${label} connectivity`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-xs text-gray-300 hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap"
        >
          <Wifi size={13} aria-hidden="true" />
          Test
        </button>
      </div>

      {/* Connectivity status row */}
      {status !== "idle" && (
        <p
          className={[
            "flex items-center gap-1.5 text-xs",
            status === "ok"
              ? "text-green-400"
              : status === "error"
                ? "text-red-400"
                : "text-gray-400",
          ].join(" ")}
          aria-live="polite"
        >
          {statusIcon}
          {statusLabel}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      {connectError && status === "error" && (
        <p
          id={`${id}-connect-error`}
          role="alert"
          className="text-xs text-red-400"
        >
          {connectError}
        </p>
      )}
    </div>
  );
};
