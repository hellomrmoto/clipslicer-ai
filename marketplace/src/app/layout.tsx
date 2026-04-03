import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodToken Marketplace",
  description: "Buy and sell homemade food in your community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
