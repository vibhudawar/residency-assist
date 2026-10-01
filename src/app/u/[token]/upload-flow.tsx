"use client";

import { Camera, Check, Images } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LedBoard, type LedRow } from "@/components/hall/led-board";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { ImageRequirement } from "@/lib/rules/types";
import type { UploadView } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import type { UploadFormState } from "./actions";

const REQUIREMENTS: Record<UploadView["kind"], ImageRequirement[]> = {
  photo: ["photo_background", "photo_portrait", "photo_size"],
  scan: ["scan_resolution", "scan_sharpness"],
};
const MAX_SIDE = 2000;

/** Phones take 4000-px, 6 MB photos; shrink to a sensible size (and bake in the rotation) before sending. */
async function prepare(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.92));
  } catch {
    return file; // the server decodes and checks it either way
  }
}

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Touch devices get a camera key; desktops get a file picker. */
const useTouch = () => useSyncExternalStore(subscribe, () => window.matchMedia("(pointer: coarse)").matches, () => false);

export function UploadFlow({
  t,
  view,
  reason,
  action,
}: {
  t: Dictionary;
  view: UploadView;
  reason: string;
  action: (prev: UploadFormState, formData: FormData) => Promise<UploadFormState>;
}) {
  const u = t.upload;
  const [state, submit, submitting] = useActionState(action, { run: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sent, setSent] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const touch = useTouch();

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  // After a failed check, bring the board and its summary into view together.
  useEffect(() => {
    if (state.run > 0 && state.result && !state.result.ok) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      board.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [state.run, state.result]);

  const busy = submitting || preparing;
  const result = state.result ?? (view.last ? { ...view.last, attemptsLeft: view.attemptsLeft } : null);
  const passed = !!state.result?.ok || view.state === "pending_review";
  // A picked file waits for Send; after an error (not a failed check) the same file can be sent again.
  const outOfTries = !!result && !result.ok && result.attemptsLeft === 0;
  const tries = (n: number) => (n === 1 ? u.triesLeftOne : u.triesLeft.replace("{n}", String(n)));
  const shownPhoto = preview ?? view.receivedUrl;
  const awaitingSend = !!file && (file !== sent || (!!state.error && !busy));

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    e.target.value = ""; // picking the same file again should still fire
    if (!chosen) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  async function send() {
    if (!file) return;
    setPreparing(true);
    const blob = await prepare(file);
    setPreparing(false);
    const fd = new FormData();
    fd.append("file", blob, "upload.jpg");
    setSent(file);
    startTransition(() => submit(fd));
  }

  const rows: LedRow[] = REQUIREMENTS[view.kind].map((key) => {
    const r = result?.requirements.find((x) => x.key === key);
    const base = { key, label: u.req[key], detail: u.req[`${key}_hint`] };
    if (busy) return { ...base, state: "fix", stateLabel: t.checkLabel };
    if (!r) return { ...base, state: "pending", stateLabel: u.notYet };
    return { ...base, state: r.ok ? "pass" : "officer", stateLabel: r.ok ? u.pass : u.fail };
  });

  const portrait = view.kind === "photo";
  const accept = "image/jpeg,image/png,image/webp"; // iOS converts HEIC to JPEG for this list

  return (
    <div className="mt-5 space-y-4">
      {/* Why the old file came back, on the one issue ramp. */}
      <section aria-label={u.why} className="grid grid-cols-[auto_1fr] gap-x-3 rounded-[6px] border border-rule bg-paper px-4 py-3.5">
        <span className="h-fit rounded-[4px] bg-fix-bg px-2 py-1 font-mono text-[12px] font-medium text-fix">{portrait ? "R4" : "R5"}</span>
        <div>
          <h2 className="text-[14px] font-medium">{u.why}</h2>
          <p className="mt-0.5 text-[14px] leading-snug text-ink-2">{reason}</p>
        </div>
      </section>

      {/* The requirements are the board: unlit before, lit in place after. */}
      <div ref={board} className="scroll-mt-4">
      <LedBoard
        key={busy ? "checking" : `run-${state.run}`}
        title={portrait ? u.needsPhoto : u.needsScan}
        rows={rows}
        checkingLabel={t.checkLabel}
        cascade={state.run > 0 && !busy}
        startMs={0}
        dense
      />
      </div>

      {passed ? (
        <section
          aria-live="polite"
          className={cn("flex gap-4 rounded-[6px] border border-ink/40 bg-paper p-4", state.result?.ok && "animate-paper-feed")}
        >
          {shownPhoto && (
            // The applicant's own file: a local preview, or a short-lived signed URL after a reload.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownPhoto} alt={u.preview} className={cn("shrink-0 rounded-[4px] border border-rule object-cover", portrait ? "h-[134px] w-[104px]" : "h-[148px] w-[104px]")} />
          )}
          <div className="min-w-0">
            {view.state !== "pending_review" && (
              <h2 className="flex items-start gap-2.5 text-[19px] leading-snug font-semibold">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok text-paper">
                  <Check aria-hidden className="size-3.5" />
                </span>
                {portrait ? u.passedPhoto : u.passedScan}
              </h2>
            )}
            <p className="mt-2 text-[15px] leading-relaxed first:mt-0">{u.passedBody}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{u.tellAssistant}</p>
          </div>
        </section>
      ) : outOfTries ? (
        <section aria-live="polite" className="rounded-[6px] border border-rule bg-paper px-5 py-4">
          <h2 className="text-[17px] font-semibold">{u.lockedTitle}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{u.lockedBody}</p>
        </section>
      ) : (
        <section aria-label={portrait ? u.slotPhoto : u.slotScan} className="rounded-[6px] border border-rule bg-paper p-4">
          {!busy && result && !result.ok && (
            <div aria-live="polite" className="mb-4 border-b border-rule pb-3.5">
              <p className="text-[15px] font-medium">{u.failedTitle}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-ink-2">
                {u.failedBody} {tries(result.attemptsLeft)}
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <div
              className={cn(
                "grid shrink-0 place-items-center overflow-hidden rounded-[4px]",
                portrait ? "h-[134px] w-[104px]" : "h-[148px] w-[104px]",
                preview ? "bg-hall" : "border border-dashed border-ink/30",
                preview && result && !result.ok && !awaitingSend && "ring-2 ring-officer ring-offset-2 ring-offset-paper",
              )}
            >
              {preview ? (
                // A local object URL of the file the applicant just picked; never leaves the device until they press Send.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt={u.preview} className="size-full object-cover" />
              ) : (
                <span className="px-2 text-center text-[12px] leading-snug text-ink-2">{portrait ? u.slotPhoto : u.slotScan}</span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
              {awaitingSend ? (
                <>
                  <Button type="button" size="lg" onClick={send} disabled={busy} className="w-full px-3 text-[14.5px] leading-tight whitespace-normal">
                    {busy ? u.sending : u.send}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => gallery.current?.click()} disabled={busy} className="w-full">
                    {u.another}
                  </Button>
                </>
              ) : (
                <>
                  {touch && (
                    <Button type="button" size="lg" onClick={() => camera.current?.click()} className="w-full px-3 text-[14.5px] leading-tight whitespace-normal">
                      <Camera aria-hidden /> {portrait ? u.takePhoto : u.takeScan}
                    </Button>
                  )}
                  <Button type="button" size="lg" variant={touch ? "outline" : "default"} onClick={() => gallery.current?.click()} className="w-full px-3 text-[14.5px] leading-tight whitespace-normal">
                    <Images aria-hidden /> {touch ? u.choose : u.chooseFile}
                  </Button>
                </>
              )}
            </div>
          </div>

          <input ref={camera} type="file" accept={accept} capture={portrait ? "user" : "environment"} onChange={pick} className="sr-only" tabIndex={-1} aria-hidden />
          <input ref={gallery} type="file" accept={accept} onChange={pick} className="sr-only" tabIndex={-1} aria-hidden />

          <div aria-live="polite">
            {state.error && (
              <p role="alert" className="mt-4 text-[13.5px] text-officer">
                {u.errors[state.error]}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
