"use server";

import { forLog } from "@/lib/security";
import { MAX_UPLOAD_BYTES, type RequirementResult, submitUpload } from "@/lib/uploads";

export interface UploadFormState {
  /** Increments on every finished check, so the board replays its cascade. */
  run: number;
  result?: { ok: boolean; requirements: RequirementResult[]; attemptsLeft: number };
  error?: "too_large" | "not_an_image" | "closed" | "not_found" | "failed";
}

export async function sendUpload(token: string, prev: UploadFormState, formData: FormData): Promise<UploadFormState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { run: prev.run, error: "not_an_image" };
  if (file.size > MAX_UPLOAD_BYTES) return { run: prev.run, error: "too_large" };
  try {
    const res = await submitUpload(token, Buffer.from(await file.arrayBuffer()));
    if (res.kind === "refused") return { run: prev.run, error: res.reason };
    return { run: prev.run + 1, result: { ok: res.ok, requirements: res.requirements, attemptsLeft: res.attemptsLeft } };
  } catch (err) {
    console.error("upload failed", forLog(err instanceof Error ? err.message : err));
    return { run: prev.run, error: "failed" };
  }
}
