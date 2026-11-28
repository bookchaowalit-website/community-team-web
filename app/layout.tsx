import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SITE_URL, SOCIAL_CARD } from "@/lib/site";
import "./globals.css";

// The font variable sits on <html>: the App shell tokens live on :root and read it from there.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const title = "Team | Bookchaowalit";
const description = "A small studio roster kept in this browser: add a person, give them a role and an availability, and find them again.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  creator: "Bookchaowalit",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: { type: "website", title, description, siteName: "Bookchaowalit", ...SOCIAL_CARD.openGraph },
  twitter: { title, description, ...SOCIAL_CARD.twitter },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
