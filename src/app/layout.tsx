import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Owow App",
  description: "Owow App Animation Hub",
  generator: "next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#161616" }}>{children}</body>
    </html>
  );
}
