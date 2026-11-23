import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Sami Social AI — YouTube Studio",
  description: "Research, create and publish YouTube content from one AI-powered workspace."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}