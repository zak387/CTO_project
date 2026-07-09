"use client";
import { useEffect, useState, useCallback } from "react";

export type LeadEvent = { id: number; type: string; at: string };
export type Lead = {
  id: number;
  name: string;
  title: string;
  company: string;
  linkedinUrl: string | null;
  email: string | null;
  channel: string;
  campaign: string;
  stage: string;
  emailSuppressed: boolean;
  meetingAt: string | null;
  meetingEmail: string | null;
  events: LeadEvent[];
  updatedAt: string;
};
export type ReviewItem = { id: number; reason: string; createdAt: string };

export function useLeads(intervalMs = 2000) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      setLeads(data.leads);
      setReviews(data.reviews);
      setLoaded(true);
    } catch {
      /* ignore transient errors while polling */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, intervalMs);
    return () => clearInterval(t);
  }, [refresh, intervalMs]);

  return { leads, reviews, loaded, refresh };
}

export function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const initials = (n: string) =>
  n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
