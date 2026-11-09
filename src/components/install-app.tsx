"use client";

import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InstallEvent = Event & { prompt: () => Promise<void> };

let deferredInstall: InstallEvent | null = null;

/** Registers the service worker and keeps the browser's install prompt for the install dialog. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstall = e as InstallEvent;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}

export function InstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [installed, setInstalled] = useState(false);
  const canInstall = open && deferredInstall !== null && !installed;

  async function install() {
    if (!deferredInstall) return;
    await deferredInstall.prompt();
    deferredInstall = null;
    setInstalled(true);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Finance Tracker to your home screen</DialogTitle>
          <DialogDescription>
            Open the app from a shortcut, full screen, like an installed app. Use the link your
            deployed site gives you, since a local address only works on this computer.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground flex flex-col gap-3 text-sm">
          <li>
            <span className="text-foreground font-medium">Android (Chrome or Edge):</span> use the
            menu and choose &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.
          </li>
          <li>
            <span className="text-foreground font-medium">iPhone (Safari):</span> tap the Share
            button, then &ldquo;Add to Home Screen&rdquo;.
          </li>
          <li>
            <span className="text-foreground font-medium">Computer (Chrome or Edge):</span> use the
            install icon at the right of the address bar.
          </li>
        </ul>
        <DialogFooter>
          {canInstall && (
            <Button type="button" onClick={install} className="gap-2 rounded-xl">
              <DownloadIcon className="size-4" />
              Install now
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
