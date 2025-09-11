import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import Navbar from "../components/Navbar";
import HomePage from "./page";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HomePage />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
