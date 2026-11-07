"use client";

import { MicIcon, MicOffIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { addTransactionQuickAction } from "@/app/(app)/transactions/quick-actions";
import { findTransactionMatchesAction } from "@/app/(app)/transactions/find-actions";
import { deleteTransactionAction } from "@/app/(app)/transactions/actions";
import { PAYMENT_MODES, type PaymentMode } from "@/lib/constants";
import { formatINR, paiseToInput, toPaise } from "@/lib/money";
import { parseVoiceCommand, type VoiceCommand } from "@/lib/voice/command";
import type { VoiceCategory, VoiceEntry } from "@/lib/voice/parse-entry";
import type { TransactionMatch } from "@/lib/transactions/find";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const PAYMENT_LABELS = Object.fromEntries(PAYMENT_MODES.map((m) => [m.value, m.label])) as Record<
  PaymentMode,
  string
>;

type Pending =
  | { kind: "add"; transcript: string; entry: VoiceEntry }
  | { kind: "delete"; transcript: string; matches: TransactionMatch[] };

export function VoiceEntry({
  expenseCategories,
  incomeCategories,
  today,
}: {
  expenseCategories: VoiceCategory[];
  incomeCategories: VoiceCategory[];
  today: string;
}) {
  const router = useRouter();
  const supported = useSyncExternalStore(
    () => () => {},
    () => getRecognitionConstructor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, startTransition] = useTransition();
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const categories = [...expenseCategories, ...incomeCategories];

  function handleCommand(transcript: string) {
    const result = parseVoiceCommand(transcript, { categories, today });
    if (!result.ok) {
      setMessage(result.reason);
      return;
    }
    const command: VoiceCommand = result.command;
    if (command.kind === "add") {
      setPending({ kind: "add", transcript, entry: command.entry });
      return;
    }
    startTransition(async () => {
      const matches = await findTransactionMatchesAction({
        amountMinor: command.amountMinor,
        categoryId: command.categoryId,
        occurredOn: command.occurredOn,
      });
      if (matches.length === 0) {
        setMessage("No matching transaction found.");
        return;
      }
      setPending({ kind: "delete", transcript, matches });
    });
  }

  function listen() {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return;
    setMessage(null);
    // Chrome and Edge send the audio to the browser vendor's speech service for transcription.
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      recognition.stop();
      handleCommand(event.results[0]?.[0]?.transcript ?? "");
    };
    recognition.onerror = (event) => {
      recognition.stop();
      setMessage(
        event.error === "not-allowed"
          ? "Microphone access is blocked. Allow it in the browser's site settings."
          : "I did not hear anything. Tap the microphone to try again.",
      );
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    setListening(true);
    recognition.start();
  }

  function saveEntry(entry: VoiceEntry) {
    startTransition(async () => {
      const result = await addTransactionQuickAction({
        type: entry.type,
        amountMinor: entry.amountMinor,
        categoryId: entry.categoryId,
        occurredOn: entry.occurredOn,
        paymentMode: entry.paymentMode,
      });
      if (result.ok) {
        setPending(null);
        setMessage(`${result.summary}${entry.categoryName ? ` · ${entry.categoryName}` : ""}`);
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  function deleteMatch(match: TransactionMatch) {
    startTransition(async () => {
      await deleteTransactionAction(match.id);
      setMessage(
        `Deleted ${formatINR(match.amountMinor)}${match.categoryName ? ` · ${match.categoryName}` : ""}`,
      );
      setPending((p) =>
        p?.kind === "delete" ? { ...p, matches: p.matches.filter((m) => m.id !== match.id) } : p,
      );
      if (pending?.kind === "delete" && pending.matches.length <= 1) setPending(null);
      router.refresh();
    });
  }

  if (!supported) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <MicOffIcon className="size-3.5" />
        Voice entry needs Chrome or Edge.
      </p>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={listen}
        disabled={listening || busy}
        aria-label="Speak a transaction"
        className="h-10 gap-2 rounded-xl px-3"
      >
        <MicIcon className={cn("size-4", listening && "animate-pulse text-rose-600")} />
        <span className="hidden text-sm sm:inline">{listening ? "Listening…" : "Speak"}</span>
      </Button>

      {message && (
        <div
          role="status"
          className="bg-foreground text-background fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm shadow-lg md:bottom-8"
        >
          {message}
        </div>
      )}

      {pending?.kind === "add" && (
        <AddDialog
          key={pending.transcript}
          transcript={pending.transcript}
          draft={pending.entry}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          today={today}
          pending={busy}
          onCancel={() => setPending(null)}
          onSave={saveEntry}
        />
      )}

      {pending?.kind === "delete" && (
        <DeleteDialog
          transcript={pending.transcript}
          matches={pending.matches}
          pending={busy}
          onClose={() => setPending(null)}
          onDelete={deleteMatch}
        />
      )}
    </>
  );
}

function DeleteDialog({
  transcript,
  matches,
  pending,
  onClose,
  onDelete,
}: {
  transcript: string;
  matches: TransactionMatch[];
  pending: boolean;
  onClose: () => void;
  onDelete: (match: TransactionMatch) => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete which transaction?</DialogTitle>
          <DialogDescription>
            I heard: &ldquo;{transcript}&rdquo;. Choose the one to delete.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-border -mx-1 flex flex-col divide-y">
          {matches.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-1 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">
                  {m.type === "income" ? "+" : "−"}
                  {formatINR(m.amountMinor)} · {m.categoryName ?? "Uncategorised"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(`${m.occurredOn}T00:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => onDelete(m)}
                className="text-destructive hover:text-destructive shrink-0 gap-1.5 rounded-lg"
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDialog({
  transcript,
  draft,
  expenseCategories,
  incomeCategories,
  today,
  pending,
  onCancel,
  onSave,
}: {
  transcript: string;
  draft: VoiceEntry;
  expenseCategories: VoiceCategory[];
  incomeCategories: VoiceCategory[];
  today: string;
  pending: boolean;
  onCancel: () => void;
  onSave: (entry: VoiceEntry) => void;
}) {
  const [type, setType] = useState<"expense" | "income">(draft.type);
  const [amount, setAmount] = useState(paiseToInput(draft.amountMinor));
  const [categoryId, setCategoryId] = useState<string | null>(draft.categoryId);
  const [occurredOn, setOccurredOn] = useState(draft.occurredOn || today);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(draft.paymentMode);
  const list = type === "expense" ? expenseCategories : incomeCategories;
  const selected = list.find((c) => c.id === categoryId);
  const amountMinor = (() => {
    try {
      return toPaise(amount);
    } catch {
      return 0;
    }
  })();

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Check before saving</DialogTitle>
          <DialogDescription>
            I heard: &ldquo;{transcript}&rdquo;. Change anything that&apos;s wrong, then save.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <ToggleGroup
            value={[type]}
            onValueChange={(v) => v[0] && setType(v[0] as "expense" | "income")}
            variant="outline"
            className="w-full"
          >
            <ToggleGroupItem value="expense" className="flex-1">
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem value="income" className="flex-1">
              Income
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="voice-amount">Amount (₹)</Label>
              <Input
                id="voice-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="voice-date">Date</Label>
              <Input
                id="voice-date"
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>{() => selected?.name ?? "Choose a category"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {list.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Payment mode</Label>
            <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>{(value: PaymentMode) => PAYMENT_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !categoryId || amountMinor <= 0}
            onClick={() =>
              onSave({
                type,
                amountMinor,
                categoryId,
                categoryName: selected?.name ?? null,
                occurredOn,
                paymentMode,
              })
            }
          >
            {pending ? "Saving…" : `Save ${amountMinor > 0 ? formatINR(amountMinor) : ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
