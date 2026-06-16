// Stage definitions per channel (see SPEC.md §2)

export const OUTBOUND_STAGES = [
  "connection_sent",
  "connected",
  "message_sent",
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

// Which event advances a lead to which stage.
export const EVENT_TO_STAGE: Record<string, string> = {
  connection_sent: "connection_sent",
  connected: "connected",
  message_sent: "message_sent",
  replied: "replied",
  signed_up: "signed_up",
  emailed: "emailed",
  booked: "booked",
};
