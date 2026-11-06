"use client";

import { useActionState } from "react";
import { createCategoryAction } from "./actions";

export function AddCategoryForm({ kind }: { kind: "expense" | "income" }) {
  const [error, formAction, pending] = useActionState(createCategoryAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`${kind}-name`} className="text-sm font-medium">
          New {kind} category
        </label>
        <input
          id={`${kind}-name`}
          name="name"
          required
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </div>
      {kind === "expense" && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${kind}-need-or-want`} className="text-sm font-medium">
            Need or want
          </label>
          <select
            id={`${kind}-need-or-want`}
            name="needOrWant"
            defaultValue="need"
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="need">Need</option>
            <option value="want">Want</option>
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
