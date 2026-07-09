// Pure mapping: a thin Supabase `subscribers` row → the shape handleInbound wants.
// Signups carry only email + domain, so name/company are DERIVED (rough on
// purpose — SAWA can correct them later). No I/O here, so it stays unit-testable.

export type Subscriber = {
  id: string;
  email: string;
  domain: string | null;
  created_at: string;
  source: string | null;
};

export type InboundInput = {
  name: string;
  email: string;
  company: string;
  title: string;
};

// "criteo" → "Criteo", "mcdonald" → "Mcdonald" (first letter of each word up).
const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

// "m.zimmermann" → "M. Zimmermann"; "sameer" → "Sameer"; single-letter tokens
// become an initial ("m" → "M.").
function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] || email).trim();
  const tokens = local.split(/[._-]+/).filter(Boolean);
  if (tokens.length === 0) return email;
  return tokens
    .map((t) => (t.length === 1 ? t.toUpperCase() + "." : titleCase(t)))
    .join(" ");
}

// "criteo.com" → "Criteo". Falls back to the email's own domain if the column
// is null. Takes the first dotted label (good enough for the campaign).
function companyFromDomain(domain: string | null, email: string): string {
  const d = (domain || email.split("@")[1] || "").trim();
  if (!d) return "";
  return titleCase(d.split(".")[0]);
}

export function mapSubscriber(row: Subscriber): InboundInput {
  return {
    name: nameFromEmail(row.email),
    email: row.email,
    company: companyFromDomain(row.domain, row.email),
    title: "",
  };
}
