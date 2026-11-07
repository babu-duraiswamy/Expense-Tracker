"use client";

import { KeyboardIcon, LogOutIcon, TagsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/(app)/actions";
import { OPEN_SHORTCUTS_EVENT } from "@/components/keyboard-shortcuts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const initial = email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3">
        <Avatar>
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="text-muted-foreground truncate px-1.5 py-1 text-xs">{email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/categories")}>
          <TagsIcon />
          Categories
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT))}>
          <KeyboardIcon />
          Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOutAction()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
