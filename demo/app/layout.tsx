import type { Metadata } from "next";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Cyberneutics demo — committee vs single call",
  description:
    "Compare a single LLM answer with an adversarial committee on the same prompt. Toggle Cybercool mode for the cyberdeck presentation skin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${shareTechMono.variable} ${orbitron.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
