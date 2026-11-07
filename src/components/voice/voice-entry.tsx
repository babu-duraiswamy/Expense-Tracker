"use client";

import { MicIcon, MicOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { addTransactionQuickAction } from "@/app/(app)/transactions/quick-actions";
import { PAYMENT_MODES, type PaymentMode } from "@/lib/constants";
import { formatINR, paiseToInput, toPaise } from "@/lib/money";
import { parseVoiceEntry, type VoiceCategory, type VoiceEntry } from "@/lib/voice/parse-entry";
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

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
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
  const [draft, setDraft] = useState<{ transcript: string; entry: VoiceEntry } | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = [...expenseCategories, ...incomeCategories];

  function listen() {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return;
    setMessage(null);
    // Chrome and Edge send the audio to the browser vendor's speech service for transcription.
    const recognition = new Ctor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      const result = parseVoiceEntry(transcript, { categories, today });
      if (!result.ok) {
        setMessage(result.reason);
        return;
      }
      setDraft({ transcript, entry: result.entry });
    };
    recognition.onerror = (event) => {
      setMessage(
        event.error === "not-allowed"
          ? "Microphone access is blocked. Allow it in the browser's site settings."
          : "I did not hear anything. Tap the microphone and try again.",
      );
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  function save(entry: VoiceEntry) {
    startTransition(async () => {
      const result = await addTransactionQuickAction({
        type: entry.type,
        amountMinor: entry.amountMinor,
        categoryId: entry.categoryId,
        occurredOn: entry.occurredOn,
        paymentMode: entry.paymentMode,
      });
      if (result.ok) {
        setDraft(null);
        setMessage(`${result.summary}${entry.categoryName ? ` · ${entry.categoryName}` : ""}`);
        router.refresh();
      } else {
        setMessage(result.error);
      }
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
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={listen}
        disabled={listening}
        className="w-fit gap-2 rounded-xl"
      >
        <MicIcon className={listening ? "size-4 animate-pulse text-rose-600" : "size-4"} />
        {listening ? "Listening…" : "Speak a transaction"}
      </Button>
      {message && (
        <p className="text-muted-foreground text-sm" role="status">
          {message}
        </p>
      )}

      {draft && (
        <ConfirmDialog
          key={draft.transcript}
          draft={draft.entry}
          transcript={draft.transcript}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          today={today}
          pending={pending}
          onCancel={() => setDraft(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  draft,
  transcript,
  expenseCategories,
  incomeCategories,
  today,
  pending,
  onCancel,
  onSave,
}: {
  draft: VoiceEntry;
  transcript: string;
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
            I heard: “{transcript}”. Change anything that&apos;s wrong, then save.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
