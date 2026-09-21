import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Rajdhani } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-cinzel-decorative",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KRATOS'26 Admin",
  description: "KRATOS'26 administration panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cinzelDecorative.variable} ${rajdhani.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
