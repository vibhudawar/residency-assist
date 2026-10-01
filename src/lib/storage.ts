import "server-only";
import { db } from "@/lib/supabase/server";

const BUCKET = "documents";

export async function putDocument(path: string, body: Buffer, contentType: string): Promise<void> {
  const { error } = await db().storage.from(BUCKET).upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

export async function getDocument(path: string): Promise<Buffer> {
  const { data, error } = await db().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  return Buffer.from(await data.arrayBuffer());
}

/** Short-lived URL so the console can show a document without making the bucket public. */
export async function signedDocumentUrl(path: string, expiresInSecs = 300): Promise<string | null> {
  const { data } = await db().storage.from(BUCKET).createSignedUrl(path, expiresInSecs);
  return data?.signedUrl ?? null;
}

export async function clearDocuments(prefix: string): Promise<void> {
  const { data } = await db().storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (data?.length) {
    await db().storage.from(BUCKET).remove(data.map((f) => `${prefix}/${f.name}`));
  }
}
