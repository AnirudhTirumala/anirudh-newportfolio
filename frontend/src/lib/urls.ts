import { resolveUploadUrl } from "@/api/client";

/** Only allow ordinary web links from API-managed profile content. This is
 * defense in depth alongside the backend schema validation. */
export function safeExternalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Resolves `profile.resume_url`, which can hold either kind of value.
 *
 * The owner can paste a link to a hosted PDF, or upload the file from the
 * admin and have the API serve it from `/uploads/resume/`. An upload is stored
 * as a backend-relative path, so it needs the API's own origin stitched on -
 * a bare `<a href="/uploads/...">` would resolve against whatever origin the
 * frontend happens to be served from and 404 in development, where the two
 * are different.
 */
export function resolveResumeUrl(value: string | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/uploads/")) {
    return resolveUploadUrl(value) || null;
  }
  return safeExternalUrl(value);
}
