"use client";

import { useActionState } from "react";
import type { Category } from "@/db/schema";
import { setArchivedAction, updateCategoryAction } from "./actions";

export function CategoryRow({ category }: { category: Category }) {
  const [error, formAction, pending] = useActionState(updateCategoryAction, undefined);

  return (
    <div
      className={`flex flex-wrap items-end gap-2 border-b border-neutral-200 py-2 ${
        category.isArchived ? "opacity-50" : ""
      }`}
    >
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={category.id} />
        <input
          name="name"
          defaultValue={category.name}
          disabled={category.isArchived}
          aria-label={`${category.name} name`}
          className="rounded border border-neutral-300 px-3 py-2"
        />
        {category.kind === "expense" && (
          <select
            name="needOrWant"
            defaultValue={category.needOrWant ?? "need"}
            disabled={category.isArchived}
            aria-label={`${category.name} need or want`}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="need">Need</option>
            <option value="want">Want</option>
          </select>
        )}
        <button
          type="submit"
          disabled={pending || category.isArchived}
          className="rounded border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setArchivedAction(category.id, !category.isArchived)}
        className="rounded border border-neutral-300 px-3 py-2 text-sm"
      >
        {category.isArchived ? "Unarchive" : "Archive"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
