import type { Metadata } from "next";
import YandexMetrika from "@/components/YandexMetrika";

import "./globals.css";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Бесплатный генератор QR-кодов для ссылок, текста, Wi-Fi, Telegram и YouTube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}