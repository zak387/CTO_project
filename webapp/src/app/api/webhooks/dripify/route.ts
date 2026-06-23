import { NextResponse } from "next/server";
import { handleDripify } from "@/lib/reconcile";
import { looksLikeLinkedinUrl } from "@/lib/linkedin";

// Dripify (Pro) points its campaign webhooks here — ONE trigger per webhook.
// Two facts about Dripify's real payload drive this handler (see CLAUDE.md §7):
//   1. It carries NO event-type field. Which transition fired is only knowable
//      from the URL you paste, so we read it from `?event=` on that URL.
//      A bare URL (no ?event=) defaults to "replied" — the most important
//      signal (the "⚑ Waiting on you" hook).
//   2. It uses its own field names (First name, LinkedIn profile URL, …). The
//      exact JSON keys aren't documented, so we map tolerantly across the
//      likely spellings AND log every raw payload — the first real fire reveals
//      the true shape so we can tighten this.

// Friendly ?event= values → the pipeline stage event handleDripify expects.
const EVENT_ALIASES: Record<string, string> = {
  reply: "replied",
  replied: "replied",
  response: "replied",
  invite: "connection_sent",
  invite_sent: "connection_sent",
  connection: "connection_sent",
  connection_sent: "connection_sent",
  sent: "connection_sent",
  accepted: "connected",
  connected: "connected",
  message: "message_sent",
  message_sent: "message_sent",
};

// Collapse a key to just its letters+digits so spacing/punctuation can't hide it:
// "LinkedIn profile URL", "linkedin_profile_url" and "LinkedinProfileUrl" all
// become "linkedinprofileurl". (The first real fire showed Dripify's URL field
// arriving under a key our exact-spelling list missed — this is the fix.)
const collapse = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// First present, non-empty value among candidate keys (separator-insensitive).
function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  const map: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) map[collapse(k)] = obj[k];
  for (const k of keys) {
    const v = map[collapse(k)];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

// Last-resort: scan every value for something that looks like a LinkedIn URL,
// no matter what key Dripify filed it under.
function findLinkedinUrlAnywhere(obj: Record<string, unknown>): string | undefined {
  for (const v of Object.values(obj)) {
    if (looksLikeLinkedinUrl(v)) return v.trim();
  }
  return undefined;
}

// A plain GET so you can confirm the endpoint is live from a browser.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "dripify webhook receiver" });
}

export async function POST(req: Request) {
  // The event is encoded in the URL, not the body.
  const rawEvent = (new URL(req.url).searchParams.get("event") ?? "").toLowerCase();
  const event = EVENT_ALIASES[rawEvent] ?? "replied";

  // Read the body defensively — Dripify normally sends JSON, but tolerate form posts.
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    try {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } catch {
      body = {};
    }
  }

  // Log the raw payload so the first real Dripify fire reveals its true field names.
  console.log("[dripify webhook]", rawEvent || "(no event)", JSON.stringify(body));

  // Map Dripify's fields into the shape handleDripify expects. `name` is built
  // from first+last when no single name field is present.
  const first = pick(body, ["first_name", "firstname", "first"]);
  const last = pick(body, ["last_name", "lastname", "last"]);
  const name =
    pick(body, ["name", "full_name", "fullname"]) ||
    [first, last].filter(Boolean).join(" ") ||
    undefined;

  const linkedinUrl =
    pick(body, [
      "linkedin_url",
      "linkedin_profile_url",
      "linkedin_profile",
      "profile_url",
      "profile_link",
      "linkedin",
      "profile",
    ]) ?? findLinkedinUrlAnywhere(body);

  if (!linkedinUrl) {
    // The join key is missing — handleDripify will fall back to name+company and
    // surface a confirm card rather than dropping it. Flag it so we notice.
    console.warn("[dripify webhook] no LinkedIn URL in payload — falling back to name+company");
  }

  const result = await handleDripify({
    event,
    linkedin_url: linkedinUrl ?? "",
    name,
    title: pick(body, ["title", "job_title", "jobtitle", "position", "occupation"]),
    company: pick(body, ["company", "company_name", "companyname", "organization"]),
    email: pick(body, ["email", "email_address", "emailaddress"]),
    raw: body, // keep the untouched payload so the Review Tray can show exactly what Dripify sent
  });
  return NextResponse.json(result);
}
