import { MicIcon } from "lucide-react";

/**
 * Full-screen indicator shown while the mic is listening or a voice
 * command is being processed. Purely visual; the animations live in globals.css.
 */
export function VoiceOrb({
  state,
  onCancel,
}: {
  state: "listening" | "working";
  onCancel?: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-10 bg-black/50 backdrop-blur-md"
    >
      <div className="voice-orb" data-state={state} aria-hidden>
        <span className="voice-orb-ring" />
        <span className="voice-orb-ring" />
        <span className="voice-orb-ring" />
        <span className="voice-orb-arc" />
        <MicIcon className="size-10" />
      </div>
      <p className="text-lg font-medium text-white">
        {state === "listening" ? "Listening…" : "Working on it…"}
      </p>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/25"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
