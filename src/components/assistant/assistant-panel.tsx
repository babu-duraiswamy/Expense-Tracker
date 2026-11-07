"use client";

import { MessageCircleIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { askAssistant } from "@/app/(app)/assistant/actions";
import { EXAMPLE_QUESTIONS } from "@/lib/assistant/parse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const OPEN_ASSISTANT_EVENT = "open-assistant";

type Message = { role: "user" | "assistant"; text: string };

const WELCOME: Message = {
  role: "assistant",
  text: "Ask me about your spending. I work from your own transactions and budgets, so I'm only as good as the data you've logged.",
};

export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    startTransition(async () => {
      const reply = await askAssistant(text);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask the assistant"
        className="fixed right-4 bottom-24 z-40 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:right-6 md:bottom-6"
      >
        <SparklesIcon className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(680px,90dvh)] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircleIcon className="text-primary size-4" />
              Ask your money
            </DialogTitle>
            <DialogDescription>
              Rule-based answers from your own data. Press Enter to send.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm">
                  Looking at your numbers…
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Try asking
                </p>
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="hover:bg-muted rounded-xl border px-3 py-2 text-left text-sm transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. What could I have avoided in July?"
              aria-label="Your question"
              maxLength={300}
              className="h-10 rounded-xl"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0 rounded-xl"
              disabled={pending || !draft.trim()}
              aria-label="Send"
            >
              <SendIcon className="size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
