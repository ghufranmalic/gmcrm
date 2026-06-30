import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GM CRM",
  description: "A lightweight multi-industry portal builder for modern businesses."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
