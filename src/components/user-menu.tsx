"use client";

import { LogOutIcon } from "lucide-react";
import { signOutAction } from "@/app/(app)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="text-muted-foreground truncate px-1.5 py-1 text-xs">{email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOutAction()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
