"use client";

import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { useActionState } from "react";
import type { Category } from "@/db/schema";
import { NEED_OR_WANT_LABELS } from "@/lib/constants";
import { setArchivedAction, updateCategoryAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CategoryRow({ category }: { category: Category }) {
  const [error, formAction, pending] = useActionState(updateCategoryAction, undefined);

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5">
      <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={category.id} />
        <Input
          name="name"
          defaultValue={category.name}
          disabled={category.isArchived}
          aria-label={`${category.name} name`}
          className="min-w-32 flex-1 sm:w-48 sm:flex-none"
        />
        {category.kind === "expense" && (
          <Select
            name="needOrWant"
            defaultValue={category.needOrWant ?? "need"}
            disabled={category.isArchived}
          >
            <SelectTrigger size="sm" aria-label={`${category.name} need or want`}>
              <SelectValue>{(value: "need" | "want") => NEED_OR_WANT_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="need">Need</SelectItem>
              <SelectItem value="want">Want</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button type="submit" variant="outline" size="sm" disabled={pending || category.isArchived}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
      {category.isArchived && <Badge variant="secondary">Archived</Badge>}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={category.isArchived ? `Unarchive ${category.name}` : `Archive ${category.name}`}
        onClick={() => setArchivedAction(category.id, !category.isArchived)}
      >
        {category.isArchived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
      </Button>
      {error && (
        <p role="alert" className="text-destructive w-full text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
