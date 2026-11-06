import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Suspense } from "react";
import { Splash } from "@/components/Splash";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ovo",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "ovo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F3F0FA",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={rubik.variable}>
      <body>
        {/* Solo en carga en frío: las navegaciones son transiciones y React no
            vuelve a mostrar el fallback de un Suspense ya revelado. */}
        <Suspense fallback={<Splash />}>{children}</Suspense>
      </body>
    </html>
  );
}
