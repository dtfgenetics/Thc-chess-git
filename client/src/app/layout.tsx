import "@/styles/globals.css";

import type { ReactNode } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AuthModal from "@/components/auth/AuthModal";

import ContextProvider from "@/context/ContextProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chess.dtfseeds.com";

export const metadata = {
  title: "Kush Kings Chess | THC Chess",
  description:
    "Play Kush Kings Chess, a cannabis-themed online chess arena by THC - Teaching Healthy Cultivation.",
  openGraph: {
    title: "Kush Kings Chess | THC Chess",
    description:
      "A clean cannabis-themed online chess arena built for the DTF Seeds games hub.",
    url: siteUrl,
    siteName: "Kush Kings Chess",
    locale: "en_US",
    type: "website"
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    noarchive: false
  },
  icons: {
    icon: [
      { type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
      { type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" }
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" }
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(siteUrl)
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="overflow-x-hidden">
        <ContextProvider>
          <Header />

          <main className="mx-1 flex min-h-[70vh] justify-center md:mx-16 lg:mx-40">
            {children}
          </main>

          <AuthModal />
        </ContextProvider>

        <Footer />

        {/* next/script issue: https://github.com/vercel/next.js/issues/43402 */}
        <script
          id="load-theme"
          dangerouslySetInnerHTML={{
            __html: `if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
              document.documentElement.setAttribute("data-theme", "kushKingsDark");
          } else {
              document.documentElement.setAttribute("data-theme", "kushKingsLight");
          }`
          }}
        ></script>
      </body>
    </html>
  );
}
