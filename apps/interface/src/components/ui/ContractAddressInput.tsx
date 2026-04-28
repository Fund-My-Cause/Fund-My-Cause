"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ContractAddressInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  hint?: string;
}

/**
 * A labelled input for a Soroban contract address (C…, 56 chars).
 * Shows inline valid/invalid icon once the user has typed enough characters.
 */
export const ContractAddressInput = ({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  error,
  hint,
}: ContractAddressInputProps) => {
  const showIcon = value.length > 0;
  const isValid = !error && value.length === 56;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          disabled={disabled}
          required={required}
          maxLength={56}
          spellCheck={false}
          autoComplete="off"
          placeholder="C…"
          aria-describedby={
            [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={!!error}
          className={[
            "w-full bg-gray-800 border rounded-lg px-3 py-2 pr-9 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:ring-1 disabled:opacity-50",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-700 focus:ring-indigo-500",
          ].join(" ")}
        />

        {showIcon && (
          <span
            aria-hidden="true"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            {isValid ? (
              <CheckCircle2 size={16} className="text-green-400" />
            ) : (
              <XCircle size={16} className="text-red-400" />
            )}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
