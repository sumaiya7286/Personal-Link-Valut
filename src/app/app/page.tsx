import type { Metadata } from "next";
import { LibraryApp } from "@/components/library/library-app";

export const metadata: Metadata = { title: "Your library" };

export default function AppPage() {
  return <LibraryApp />;
}
