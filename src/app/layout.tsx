import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { defaultSiteDescription, getCanonicalUrl, getPublicSiteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/Geist-Regular.ttf",
  display: "swap",
  variable: "--font-geist-sans",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: getPublicSiteUrl(),
  title: "Ajmot Hossain — Full-Stack Developer",
  description: defaultSiteDescription,
  alternates: getCanonicalUrl("/") ? { canonical: getCanonicalUrl("/") } : undefined,
  openGraph: {
    type: "website",
    siteName: "Ajmot Hossain",
    title: "Ajmot Hossain — Full-Stack Developer",
    description: defaultSiteDescription,
    ...(getCanonicalUrl("/") ? { url: getCanonicalUrl("/") } : {}),
  },
  twitter: {
    card: "summary",
    title: "Ajmot Hossain — Full-Stack Developer",
    description: defaultSiteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={geistSans.variable} lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <SpeedInsights />
      </body>
    </html>
  );
}
