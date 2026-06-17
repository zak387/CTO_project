// Stage definitions per channel (see SPEC.md §2)

// Outbound tracks only two transitions — Replied and Booked. "Connection Sent"
// is the resting bucket every imported lead starts in (not a Dripify event).
// Connected / Message Sent were dropped: Dripify gives us only the reply event
// (one webhook condition per campaign), so they had no data source. See §7/§9.
export const OUTBOUND_STAGES = [
  "connection_sent",
  "replied",
  "booked",
] as const;

export const INBOUND_STAGES = [
  "signed_up",
  "emailed",
  "replied",
  "booked",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  connection_sent: "Connection Sent",
  connected: "Connected",
  message_sent: "Message Sent",
  replied: "Replied",
  booked: "Booked",
  signed_up: "Signed Up",
  emailed: "Emailed",
  cancelled: "Cancelled",
};

export function stagesFor(channel: string) {
  return channel === "inbound" ? INBOUND_STAGES : OUTBOUND_STAGES;
}

// Which event advances a lead to which stage. We only wire the reply webhook,
// but if a stray connected/message_sent event ever arrives it keeps the lead in
// the pre-reply "Connection Sent" bucket rather than a column that no longer exists.
export const EVENT_TO_STAGE: Record<string, string> = {
  connection_sent: "connection_sent",
  connected: "connection_sent",
  message_sent: "connection_sent",
  replied: "replied",
  signed_up: "signed_up",
  emailed: "emailed",
  booked: "booked",
};
