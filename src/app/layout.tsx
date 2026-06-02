import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueryCraft — Visual Query Builder",
  description:
    "Build complex database queries visually without writing raw syntax",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
