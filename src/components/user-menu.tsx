"use client";

import {
  DownloadIcon,
  KeyboardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  TagsIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { InstallDialog } from "@/components/install-app";
import { signOutAction } from "@/app/(app)/actions";
import { OPEN_SHORTCUTS_EVENT } from "@/components/keyboard-shortcuts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { readTheme, setTheme, THEME_CHANGE_EVENT, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "Device", icon: MonitorIcon },
];

function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const initial = email.charAt(0).toUpperCase();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as Theme);
  const [installOpen, setInstallOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3">
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <div className="text-muted-foreground truncate px-1.5 py-1 text-xs">{email}</div>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Theme</DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-1 p-1">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors",
                  theme === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/categories")}>
            <TagsIcon />
            Categories
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setInstallOpen(true)}>
            <DownloadIcon />
            Add to home screen
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
      <InstallDialog open={installOpen} onOpenChange={setInstallOpen} />
    </>
  );
}
