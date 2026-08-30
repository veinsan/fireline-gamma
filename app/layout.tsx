import { Atkinson_Hyperlegible, Barlow_Condensed } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata = {
  title: "FIRELINE | Risk Command Canvas",
  description: "Dashboard historis anomali termal FIRMS dan konteks risiko Kalimantan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={body.variable + " " + display.variable}>{children}</body>
    </html>
  );
}
