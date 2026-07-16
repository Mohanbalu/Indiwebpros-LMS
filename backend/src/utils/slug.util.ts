import { randomBytes } from "crypto";

/**
 * Converts a string to a URL-safe slug.
 * e.g. "Hello World! 101" → "hello-world-101"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove non-word chars
    .replace(/[\s_]+/g, "-")    // spaces/underscores → hyphens
    .replace(/--+/g, "-")       // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");   // strip leading/trailing hyphens
}

/**
 * Generates a unique slug by appending a short random suffix.
 * Use when uniqueness must be guaranteed without a DB round-trip.
 */
export function generateUniqueSlug(title: string): string {
  const base = slugify(title);
  const suffix = randomBytes(3).toString("hex"); // e.g. "a3f9c2"
  return `${base}-${suffix}`;
}

/**
 * Resolves a unique slug by checking the DB.
 * Appends numeric counter on collision. Max 10 attempts.
 */
export async function resolveUniqueSlug(
  base: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  const baseSlug = slugify(base);
  let slug = baseSlug;

  for (let i = 0; i < maxAttempts; i++) {
    const exists = await checkExists(slug);
    if (!exists) return slug;
    slug = i === 0 ? `${baseSlug}-${randomBytes(3).toString("hex")}` : `${baseSlug}-${randomBytes(4).toString("hex")}`;
  }

  // Final fallback with full random suffix
  return `${baseSlug}-${randomBytes(6).toString("hex")}`;
}
