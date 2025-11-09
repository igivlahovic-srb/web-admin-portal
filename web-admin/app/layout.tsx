import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Water Service Admin Panel",
  description: "Admin panel for water service management",
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
