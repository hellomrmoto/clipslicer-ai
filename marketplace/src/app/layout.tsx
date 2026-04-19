import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLATE — Local Food Marketplace",
  description: "Order homemade food from local cooks. Every delivery verified.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#080808] text-white">
        {children}
      </body>
    </html>
  );
}
