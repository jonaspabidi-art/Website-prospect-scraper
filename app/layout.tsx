import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Kalam } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const kalam = Kalam({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-kalam" });

export const metadata: Metadata = {
  title: "ProspektAI",
  description: "Hitta företag utan hemsida i Sverige",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${geist.variable} ${kalam.variable} h-full`}>
      <body className="h-full flex" style={{ background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-geist), Arial, sans-serif" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
