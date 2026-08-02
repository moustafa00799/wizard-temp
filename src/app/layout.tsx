import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campaign Diagnosis Wizard",
  description: "بناء استراتيجيات إعلانية ذكية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}
