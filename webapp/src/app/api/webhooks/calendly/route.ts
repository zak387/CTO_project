import { NextResponse } from "next/server";
import { handleCalendly } from "@/lib/reconcile";

// Calendly points its webhook subscription here. Real payloads are NESTED under
// `payload` and use event names "invitee.created" / "invitee.canceled"; the
// booker's Company (only when the event type asks for it) lives in
// questions_and_answers, and the call time in scheduled_event.start_time.
// We map that into the flat shape handleCalendly expects, and still tolerate a
// already-flat body so the local simulator / tests keep working. See SPEC.md §7.

type QA = { question?: string; answer?: string };

// Pull the Company answer out of the booking questions, whatever it's labelled.
function pickCompany(qa: QA[] = []): string | undefined {
  const hit = qa.find((q) => /company|organi[sz]ation|employer/i.test(q.question ?? ""));
  return hit?.answer?.trim() || undefined;
}

export async function POST(req: Request) {
  let raw: Record<string, unknown> = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }

  // Detect the real Calendly shape (everything hangs off `payload`).
  const payload = raw.payload as Record<string, unknown> | undefined;
  let mapped: Parameters<typeof handleCalendly>[0];

  if (payload) {
    const ev = String(raw.event ?? "");
    const scheduled = payload.scheduled_event as Record<string, unknown> | undefined;
    const name =
      (payload.name as string) ||
      [payload.first_name, payload.last_name].filter(Boolean).join(" ") ||
      undefined;
    mapped = {
      event: ev === "invitee.canceled" ? "booking_canceled" : "booking_created",
      invitee_email: ((payload.email as string) || "").toLowerCase() || undefined,
      name,
      company: pickCompany(payload.questions_and_answers as QA[] | undefined),
      start_time: scheduled?.start_time as string | undefined,
      // The event type name (e.g. "15 Minute Meeting NYC Dinner") is the campaign
      // marker — handleCalendly keys off it, not name/company guesses.
      event_type_name: scheduled?.name as string | undefined,
    };
  } else {
    // Flat shape (simulator / tests) — pass through, lowercasing the email so it
    // matches the lowercased emails stored at import.
    mapped = {
      ...(raw as Parameters<typeof handleCalendly>[0]),
      invitee_email: (raw.invitee_email as string | undefined)?.toLowerCase(),
    };
  }

  // The dinner link is the campaign signal; generic links are noise.
  console.log("[calendly webhook]", mapped.event, mapped.event_type_name || "(no type)", mapped.invitee_email || "(no email)");

  const result = await handleCalendly(mapped);
  return NextResponse.json(result);
}
