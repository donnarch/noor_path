import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/noto-naskh-arabic";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: { default: "Noor Path: Learn. Practise. Understand. Grow.", template: "%s · Noor Path" },
  description: "Learn how to pray, practise prayer positions and understand Islam step by step. No account needed.",
  openGraph: { title: "Noor Path", description: "Learn. Practise. Understand. Grow.", type: "website" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F8FAFC" }, { media: "(prefers-color-scheme: dark)", color: "#08101F" }] };

const themeScript = `try{var t=localStorage.getItem("noorpath:theme");if(!t)t=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3">Skip to content</a>
        <Header />
        <main id="main" className="pb-28 pt-20 md:pb-0 md:pt-28">{children}</main>
        <Footer />
      </body>
    </html>
  );
}