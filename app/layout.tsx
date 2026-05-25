import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "JD Prospects",
  description: "Hitta företag utan hemsida i Sverige",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} h-full`}>
      <body className="h-full flex" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="mobile-header">
            <Image src="/logo-tight.png" alt="JD Prospects" height={28} width={140} style={{ height: 28, width: 'auto' }} />
          </header>
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
