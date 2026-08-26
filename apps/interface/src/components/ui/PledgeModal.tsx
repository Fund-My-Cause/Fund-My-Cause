"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { TransactionStatus, TxStatus } from "@/components/ui/TransactionStatus";
import { useToast } from "@/components/ui/Toast";

interface PledgeModalProps {
  campaignTitle: string;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const TITLE_ID = "pledge-modal-title";

export function PledgeModal({ campaignTitle, onClose }: PledgeModalProps) {
  const { address, connect } = useWallet();
  const { addToast } = useToast();
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus, close on Escape, and restore focus to the trigger element on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const nodes = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handlePledge = async () => {
    if (!address) {
      await connect();
      return;
    }
    
    // Simulate transaction lifecycle
    setTxStatus("signing");
    
    setTimeout(() => {
      setTxStatus("submitting");
      
      setTimeout(() => {
        setTxStatus("confirming");
        
        setTimeout(() => {
          // Simulate successful transaction with a mock hash
          const mockHash = "a1b2c3d4e5f6789012345678901234567890123456789012345678901234";
          setTxHash(mockHash);
          setTxStatus("success");
          addToast("Pledge submitted successfully!", "success", mockHash);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  const handleDismiss = () => {
    setTxStatus("idle");
    setTxHash("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h2 id={TITLE_ID} className="text-lg font-semibold">Pledge to {campaignTitle}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {txStatus === "success" || txStatus === "error" ? (
          <TransactionStatus 
            status={txStatus} 
            txHash={txHash}
            onDismiss={handleDismiss}
          />
        ) : txStatus !== "idle" ? (
          <TransactionStatus status={txStatus} />
        ) : (
          <>
            <input
              type="number"
              placeholder="Amount in XLM"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={handlePledge}
              disabled={txStatus !== "idle"}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-xl font-medium transition disabled:opacity-50"
            >
              {txStatus !== "idle" ? "Processing..." : address ? "Confirm Pledge" : "Connect Wallet to Pledge"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
