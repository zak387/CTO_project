import { test } from "node:test";
import assert from "node:assert/strict";
import { mapSubscriber } from "./subscriber-map";

test("dotted email → initial + surname, company from domain", () => {
  const out = mapSubscriber({
    id: "1", email: "m.zimmermann@criteo.com", domain: "criteo.com",
    created_at: "2026-07-06T20:23:24Z", source: null,
  });
  assert.equal(out.name, "M. Zimmermann");
  assert.equal(out.company, "Criteo");
  assert.equal(out.email, "m.zimmermann@criteo.com");
  assert.equal(out.title, "");
});

test("single-token local part → capitalized", () => {
  const out = mapSubscriber({
    id: "2", email: "sameer@netsolutions.com", domain: "netsolutions.com",
    created_at: "2026-07-02T14:51:05Z", source: "net-solutions",
  });
  assert.equal(out.name, "Sameer");
  assert.equal(out.company, "Netsolutions");
});

test("hyphen/underscore separators split into words", () => {
  const out = mapSubscriber({
    id: "3", email: "jane_doe-smith@example.io", domain: "example.io",
    created_at: "2026-07-01T00:00:00Z", source: null,
  });
  assert.equal(out.name, "Jane Doe Smith");
});

test("null domain falls back to the email's domain", () => {
  const out = mapSubscriber({
    id: "4", email: "jill@bigscoots.com", domain: null,
    created_at: "2026-07-01T00:00:00Z", source: null,
  });
  assert.equal(out.company, "Bigscoots");
  assert.equal(out.name, "Jill");
});
