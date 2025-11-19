import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flipdot Controller",
  description: "Animation editor and viewer for flipdot display",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
