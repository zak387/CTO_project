// The Reconciliation Queue (see SPEC.md §6)
// Every incoming event runs the matching ladder, then updates the right Lead
// silently — or drops to the Review Tray when uncertain.

import { prisma } from "./prisma";
import { EVENT_TO_STAGE } from "./stages";

type Ladder = {
  leadId?: number;
  linkedinUrl?: string;
  email?: string;
  name?: string;
  company?: string;
};

// Returns { lead, matchType } or null.
async function matchLead(k: Ladder) {
  // 1. hidden lead id (Calendly)
  if (k.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: k.leadId } });
    if (lead) return { lead, matchType: "id" as const };
  }
  // 2. LinkedIn URL (Dripify)
  if (k.linkedinUrl) {
    const lead = await prisma.lead.findUnique({
      where: { linkedinUrl: k.linkedinUrl },
    });
    if (lead) return { lead, matchType: "linkedin" as const };
  }
  // 3. email (Calendly fallback / landing form)
  if (k.email) {
    const lead = await prisma.lead.findFirst({ where: { email: k.email } });
    if (lead) return { lead, matchType: "email" as const };
  }
  // 4. company + unique name -> only auto-accept if exactly one
  if (k.name && k.company) {
    const candidates = await prisma.lead.findMany({
      where: { name: k.name, company: k.company },
    });
    if (candidates.length === 1)
      return { lead: candidates[0], matchType: "fuzzy" as const };
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
}) {
  const match = await matchLead({ linkedinUrl: body.linkedin_url, name: body.name, company: body.company });
  if (!match) {
    await review(`Dripify "${body.event}" for unknown profile ${body.linkedin_url}`, body);
    return { status: "review" };
  }
  const lead = match.lead;
  const stage = EVENT_TO_STAGE[body.event];
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      stage: stage ?? lead.stage,
      // suppress email the moment they reply (SPEC.md §6.6)
      emailSuppressed: body.event === "replied" ? true : lead.emailSuppressed,
    },
  });
  await addEvent(lead.id, body.event);
  return { status: "ok", leadId: lead.id };
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

  if (match && (match.matchType === "id" || match.matchType === "linkedin" || match.matchType === "email")) {
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
