import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Fantana WHS Admin Panel",
  description: "Admin panel for La Fantana water heating system management",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  );
}
