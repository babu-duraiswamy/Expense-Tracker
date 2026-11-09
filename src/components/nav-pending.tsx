"use client";

import { Loader2Icon } from "lucide-react";
import { useLinkStatus } from "next/link";

export function NavPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2Icon aria-hidden className="size-3.5 animate-spin" />;
}
