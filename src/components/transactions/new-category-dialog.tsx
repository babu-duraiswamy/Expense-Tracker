"use client";

import { useState, useTransition } from "react";
import { createCategoryInlineAction, type InlineCategory } from "@/app/(app)/categories/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEED_WANT_LABELS = { need: "Need", want: "Want" } as const;

export function NewCategoryDialog({
  open,
  onOpenChange,
  kind,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "expense" | "income";
  onCreated: (category: InlineCategory) => void;
}) {
  const [name, setName] = useState("");
  const [needOrWant, setNeedOrWant] = useState<"need" | "want">("need");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function reset() {
    setName("");
    setNeedOrWant("need");
    setError(undefined);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createCategoryInlineAction({
        name,
        kind,
        needOrWant: kind === "expense" ? needOrWant : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(result.category);
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>New {kind} category</DialogTitle>
            <DialogDescription>
              {kind === "expense"
                ? "Tag it as a need or a want so it shows up in your needs-vs-wants split."
                : "Income categories help you see where your money comes from."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-category-name">Name</Label>
            <Input
              id="new-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "expense" ? "e.g. Pet supplies" : "e.g. Side project"}
              maxLength={60}
              autoFocus
              required
            />
          </div>

          {kind === "expense" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-category-need-want">Need or want</Label>
              <Select value={needOrWant} onValueChange={(v) => setNeedOrWant(v as "need" | "want")}>
                <SelectTrigger id="new-category-need-want" className="w-full">
                  <SelectValue>{(value: "need" | "want") => NEED_WANT_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="need">Need</SelectItem>
                  <SelectItem value="want">Want</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {pending ? "Adding…" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
