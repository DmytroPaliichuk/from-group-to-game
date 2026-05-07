import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hometown Map",
  description: "US athlete hometown map",
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
