// The matching ladder (see SPEC.md §6)
// Every incoming event runs the ladder and silently updates the right Lead.
// Ladder: LinkedIn URL → email → unique name (company ignored; people change
// jobs) → name+company only to break a tie. Nothing reaches Adam: in the rare
// case it genuinely can't decide, it leaves a quiet backstop note for SAWA.

import { prisma } from "./prisma";
import { EVENT_TO_STAGE } from "./stages";
import { normLinkedin } from "./linkedin";

type Ladder = {
  leadId?: number;
  linkedinUrl?: string;
  email?: string;
  name?: string;
  company?: string;
};

// --- loose-match helpers (case/punctuation tolerant) ----------------------
const normName = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
// Drop the corporate suffix noise so "Eagle's Honor, LLC" == "Eagles Honor".
const normCompany = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(llc|inc|ltd|corp|co|company|gmbh|plc|sa)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// True when two names plausibly belong to the same person, allowing for
// LinkedIn truncating the surname to an initial ("Raymond Hofmeister" ⇄
// "Raymond H.").
function nameLooksSame(a: string, b: string): boolean {
  const A = normName(a).split(" ").filter(Boolean);
  const B = normName(b).split(" ").filter(Boolean);
  if (!A.length || !B.length) return false;
  if (A[0] !== B[0]) return false; // first names must agree
  const al = A[A.length - 1];
  const bl = B[B.length - 1];
  if (al === bl) return true;
  if (al.length === 1 && bl.startsWith(al)) return true; // "h" ⇄ "hofmeister"
  if (bl.length === 1 && al.startsWith(bl)) return true;
  return false;
}

// Returns { lead, matchType } or null.
async function matchLead(k: Ladder) {
  // 1. hidden lead id (Calendly)
  if (k.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: k.leadId } });
    if (lead) return { lead, matchType: "id" as const };
  }
  // 2. LinkedIn URL (Dripify) — normalize the incoming URL the SAME way the
  //    importer normalized the stored one, or the exact lookup silently misses.
  const url = normLinkedin(k.linkedinUrl);
  if (url) {
    const lead = await prisma.lead.findUnique({ where: { linkedinUrl: url } });
    if (lead) return { lead, matchType: "linkedin" as const };
  }
  // 3. email (Calendly fallback / landing form)
  if (k.email) {
    const lead = await prisma.lead.findFirst({ where: { email: k.email } });
    if (lead) return { lead, matchType: "email" as const };
  }
  // 4. name match. We only ever match against our own list (we don't import
  //    external leads), so a UNIQUE name is trusted on its own — a CIO who
  //    moved from Shock Tech to Eagle's Honor is still the same Raymond.
  //    Company is only used to break a tie when the name isn't unique.
  if (k.name) {
    const all = await prisma.lead.findMany();
    const hits = all.filter((l) => nameLooksSame(k.name!, l.name));
    if (hits.length === 1) return { lead: hits[0], matchType: "name" as const };
    if (hits.length > 1 && k.company) {
      const nc = normCompany(k.company);
      const narrowed = hits.filter((l) => normCompany(l.company) === nc);
      if (narrowed.length === 1)
        return { lead: narrowed[0], matchType: "fuzzy" as const };
    }
  }
  return null;
}

async function addEvent(leadId: number, type: string) {
  await prisma.event.create({ data: { leadId, type } });
}

async function review(reason: string, payload: unknown) {
  await prisma.reviewItem.create({
    data: { reason, payload: JSON.stringify(payload) },
  });
}

// ---- Dripify: connection_sent | connected | message_sent | replied ----
export async function handleDripify(body: {
  event: string;
  linkedin_url: string;
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  raw?: unknown;
}) {
  const match = await matchLead({ linkedinUrl: body.linkedin_url, name: body.name, company: body.company });
  if (!match) {
    // Genuinely couldn't place it (no URL/email match and the name was either
    // unknown or ambiguous). Rare in a 200-list. We DON'T guess wrong and we
    // DON'T bother Adam — just leave a silent backstop note for SAWA, with the
    // raw payload, in case someone wants to place it by hand later.
    const who = body.name || body.linkedin_url || "an unknown profile";
    await review(`Dripify "${body.event}" we couldn't place: ${who}`, body.raw ?? body);
    return { status: "review" };
  }
  await applyDripifyEvent(match.lead.id, body.event);
  return { status: "ok", leadId: match.lead.id };
}

// Advance a known lead for a Dripify event (the webhook's auto-match path).
export async function applyDripifyEvent(leadId: number, event: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return null;
  const stage = EVENT_TO_STAGE[event];
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: stage ?? lead.stage,
      // suppress email the moment they reply (SPEC.md §6.6)
      emailSuppressed: event === "replied" ? true : lead.emailSuppressed,
    },
  });
  await addEvent(leadId, event);
  return lead;
}

// ---- Calendly: booking_created | booking_canceled ----
export async function handleCalendly(body: {
  event: string;
  lead_id?: number;
  invitee_email?: string;
  start_time?: string;
  name?: string;
  company?: string;
}) {
  const match = await matchLead({
    leadId: body.lead_id,
    email: body.invitee_email,
    name: body.name,
    company: body.company,
  });
  if (!match) {
    await review(`Calendly booking we couldn't place (${body.invitee_email ?? "no email"})`, body);
    return { status: "review" };
  }
  const lead = match.lead;

  if (body.event === "booking_canceled") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { stage: "replied", meetingAt: null, meetingEmail: null },
    });
    await addEvent(lead.id, "cancelled");
    return { status: "ok", leadId: lead.id };
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      stage: "booked",
      meetingAt: body.start_time ? new Date(body.start_time) : new Date(),
      meetingEmail: body.invitee_email ?? lead.email,
      emailSuppressed: true,
    },
  });
  await addEvent(lead.id, "booked");
  return { status: "ok", leadId: lead.id };
}

// ---- Landing page: new inbound signup ----
export async function handleInbound(body: {
  name: string;
  email: string;
  company: string;
  title?: string;
  linkedin_url?: string;
}) {
  const match = await matchLead({
    email: body.email,
    linkedinUrl: body.linkedin_url,
    name: body.name,
    company: body.company,
  });

  if (match && (match.matchType === "id" || match.matchType === "linkedin" || match.matchType === "email" || match.matchType === "name")) {
    // Known person who also signed up -> link, don't duplicate.
    await prisma.lead.update({
      where: { id: match.lead.id },
      data: { channel: "both" },
    });
    await addEvent(match.lead.id, "signed_up");
    return { status: "linked", leadId: match.lead.id };
  }

  if (match && match.matchType === "fuzzy") {
    await review(`Inbound signup may be ${body.name} at ${body.company} — confirm`, body);
    return { status: "review" };
  }

  // Genuinely new -> create a new inbound lead (inbound grows the list).
  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      title: body.title ?? "",
      company: body.company,
      email: body.email,
      linkedinUrl: body.linkedin_url || null,
      channel: "inbound",
      stage: "signed_up",
    },
  });
  await addEvent(lead.id, "signed_up");
  return { status: "created", leadId: lead.id };
}
