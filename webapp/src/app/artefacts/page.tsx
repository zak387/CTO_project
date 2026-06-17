import { redirect } from "next/navigation";

// Artefacts is a menu, not a page — default to the Posts calendar.
export default function ArtefactsIndex() {
  redirect("/artefacts/posts");
}
