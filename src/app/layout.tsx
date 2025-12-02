import type { Metadata } from "next";
import "./globals.css";
import { Theme } from "@radix-ui/themes";

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
    <Theme>
      <html lang="en" suppressHydrationWarning>
        <body style={{ backgroundColor: "#161616" }}>{children}</body>
      </html>
    </Theme>
  );
}
