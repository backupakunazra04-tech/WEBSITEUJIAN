import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ujian Online - SMAS Unggulan BPPT Al Fattah",
  description: "Sistem Ujian Online Anti-Curang",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8FAFC] text-slate-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}