import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ovo",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Ovo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F3F0FA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={rubik.variable}>
      <body>{children}</body>
    </html>
  );
}
