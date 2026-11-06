"use client";

import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { deleteTransactionAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ id, label }: { id: string; label: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Delete ${label}`}
      disabled={pending}
      onClick={async () => {
        if (!confirm(`Delete this transaction (${label})? This cannot be undone.`)) return;
        setPending(true);
        try {
          await deleteTransactionAction(id);
        } catch {
          alert("Could not delete this transaction.");
        } finally {
          setPending(false);
        }
      }}
    >
      <TrashIcon />
    </Button>
  );
}
