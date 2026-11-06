"use client";

import { PlusIcon } from "lucide-react";
import { useActionState } from "react";
import { NEED_OR_WANT_LABELS } from "@/lib/constants";
import { createCategoryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddCategoryForm({ kind }: { kind: "expense" | "income" }) {
  const [error, formAction, pending] = useActionState(createCategoryAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${kind}-name`} className="sr-only">
          New {kind} category
        </Label>
        <Input id={`${kind}-name`} name="name" required placeholder={`New ${kind} category`} />
      </div>
      {kind === "expense" && (
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${kind}-need-or-want`} className="sr-only">
            Need or want
          </Label>
          <Select name="needOrWant" defaultValue="need">
            <SelectTrigger id={`${kind}-need-or-want`} aria-label="Need or want">
              <SelectValue>{(value: "need" | "want") => NEED_OR_WANT_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="need">Need</SelectItem>
              <SelectItem value="want">Want</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" disabled={pending}>
        <PlusIcon />
        {pending ? "Adding…" : "Add"}
      </Button>
      {error && (
        <p role="alert" className="text-destructive w-full text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
