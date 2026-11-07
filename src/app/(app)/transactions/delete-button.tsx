"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteTransactionAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="text-destructive hover:text-destructive w-full gap-2 rounded-xl"
      onClick={async () => {
        if (!confirm("Delete this transaction? This cannot be undone.")) return;
        setPending(true);
        try {
          await deleteTransactionAction(id);
          router.push("/transactions");
        } catch {
          alert("Could not delete this transaction.");
          setPending(false);
        }
      }}
    >
      <Trash2Icon className="size-4" />
      {pending ? "Deleting…" : "Delete transaction"}
    </Button>
  );
}
