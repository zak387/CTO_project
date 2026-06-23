// The single source of truth for turning a LinkedIn profile URL into a stable
// match key. The importer normalizes every stored URL with this, so the webhook
// MUST normalize incoming URLs the same way or the exact-match lookup silently
// fails (same person, different spelling). Keep this the only copy.
export function normLinkedin(v: string | null | undefined): string | null {
  if (!v) return null;
  let s = v.trim().replace(/^["'<]+|["'>]+$/g, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  s = s.toLowerCase().split("?")[0].split("#")[0]; // drop query + hash
  s = s.replace(/^https?:\/\/www\./, "https://"); // drop www.
  s = s.replace(/\/+$/, ""); // drop trailing slash(es)
  return s || null;
}

// True when a value looks like a LinkedIn profile URL — used to fish the URL out
// of an unknown field when Dripify labels it with a key we didn't predict.
export function looksLikeLinkedinUrl(v: unknown): v is string {
  return typeof v === "string" && /linkedin\.com\/(in|pub)\//i.test(v);
}
