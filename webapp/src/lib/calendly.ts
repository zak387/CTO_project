// Safety-net sync (SPEC.md §7). The webhook is the real-time path; this PULLS
// every booking on the NYC dinner event type straight from Calendly and runs
// each through handleCalendly — the same reconciliation the webhook uses. So if
// a webhook is ever missed, a run of this heals it, and it can surface all
// existing dinner bookings on demand. bookLead/cancelLead are idempotent, so
// re-running is safe (no duplicate leads or timeline events).

import { handleCalendly } from "./reconcile";

const API = "https://api.calendly.com";

// The dinner event type is the campaign marker — same rule as the webhook.
const DINNER = /dinner/i;

type QA = { question?: string; answer?: string };
type CalEvent = { uri: string; name?: string; status?: string; start_time?: string };
type CalInvitee = {
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  questions_and_answers?: QA[];
};
type Page<T> = { collection?: T[]; pagination?: { next_page?: string | null } };
type Me = { resource: { current_organization: string } };

function pickCompany(qa: QA[] = []): string | undefined {
  const hit = qa.find((q) => /company|organi[sz]ation|employer/i.test(q.question ?? ""));
  return hit?.answer?.trim() || undefined;
}

async function cal<T>(token: string, url: string): Promise<T> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Calendly ${r.status} on ${url}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export async function syncCalendlyDinnerBookings() {
  const token = process.env.CALENDLY;
  if (!token) {
    // Safe diagnostic: names only, never values. Reveals casing/scope mistakes
    // (e.g. a stray lowercase "calendly") without leaking the secret.
    return {
      ok: false as const,
      error: "CALENDLY token is not set in the environment.",
      seen: Object.keys(process.env).filter((k) => /calend/i.test(k)),
      cronSecretPresent: !!process.env.CRON_SECRET,
    };
  }

  // 1. Whose account → which organization.
  const me = await cal<Me>(token, `${API}/users/me`);
  const org = me.resource.current_organization;

  // 2. Page through every scheduled event (active + canceled) on the org.
  const events: CalEvent[] = [];
  let url: string | null = `${API}/scheduled_events?organization=${encodeURIComponent(org)}&count=100`;
  while (url) {
    const page: Page<CalEvent> = await cal<Page<CalEvent>>(token, url);
    events.push(...(page.collection ?? []));
    url = page.pagination?.next_page ?? null;
  }

  // 3. Keep only dinner-event bookings.
  const dinner = events.filter((e) => DINNER.test(e.name ?? ""));
  const summary = { ok: true as const, scanned: events.length, dinner: dinner.length, booked: 0, created: 0, canceled: 0, ignored: 0 };

  // 4. Reconcile each invitee through the shared webhook path.
  for (const ev of dinner) {
    const invitees = await cal<Page<CalInvitee>>(token, `${ev.uri}/invitees?count=100`);
    for (const inv of invitees.collection ?? []) {
      const canceled = ev.status === "canceled";
      const res = await handleCalendly({
        event: canceled ? "booking_canceled" : "booking_created",
        invitee_email: (inv.email ?? "").toLowerCase() || undefined,
        name: inv.name || [inv.first_name, inv.last_name].filter(Boolean).join(" ") || undefined,
        company: pickCompany(inv.questions_and_answers),
        start_time: ev.start_time,
        event_type_name: ev.name,
      });
      if (res.status === "created") summary.created++;
      else if (res.status === "ignored") summary.ignored++;
      else if (canceled) summary.canceled++;
      else summary.booked++;
    }
  }
  return summary;
}
