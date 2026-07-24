import type { Metadata } from "next";
import { Outfit } from "next/font/google";

import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bezemisi.vercel.app"),
  title: {
    default: "Bez emisí | Elektromobily srozumitelně",
    template: "%s | Bez emisí",
  },
  description:
    "Pomoc s výběrem elektromobilu, nabíjením a cestou k ověřené nabídce Bez emisí.",
  icons: {
    icon: "/brand/bezemisi-favicon.png",
    apple: "/brand/bezemisi-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a className="skip-link" href="#hlavni-obsah">
          Přeskočit na obsah
        </a>
        <Header />
        <main id="hlavni-obsah" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
