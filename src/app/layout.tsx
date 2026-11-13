import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const body = DM_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Stash — every link worth keeping", template: "%s · Stash" },
  description:
    "Save videos, docs and articles in one beautiful, searchable place. Collections, tags, notes and instant previews, synced across every device.",
  applicationName: "Stash",
};

export const viewport: Viewport = {
  themeColor: "#060709",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="grain min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
