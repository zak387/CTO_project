import { redirect } from "next/navigation";

// The Overview/Briefing home was removed — the Lead Pipeline is now the de-facto
// home. "/" redirects straight there.
export default function Home() {
  redirect("/pipeline");
}
