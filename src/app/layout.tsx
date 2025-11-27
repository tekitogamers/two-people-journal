"use client";

import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-pink-50 min-h-screen text-pink-900">
        {/* ナビゲーション */}
        <header className="w-full bg-pink-50 shadow-sm py-3 px-4 sm:px-6 flex justify-between items-center">
          <h1 className="text-sm sm:text-xl font-bold text-pink-500 truncate">
            ふたりのひみつ💞
          </h1>
          <nav className="flex gap-3 sm:gap-4 text-pink-500 font-semibold overflow-x-auto">
            <Link className="whitespace-nowrap px-1" href="/calender">📅</Link>
            <Link className="whitespace-nowrap px-1" href="/memories">📸</Link>
            <Link className="whitespace-nowrap px-1" href="/login">🔐</Link>
          </nav>
        </header>

        {/* メインコンテンツ */}
        <main className="p-4 sm:p-6 bg-pink-50">{children}</main>
      </body>
    </html>
  );
}
