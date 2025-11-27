"use client";

import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-pink-50 min-h-screen text-pink-900">
        {/* ナビゲーション */}
        <header className="w-full bg-white shadow-sm py-3 px-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-500">ふたりのひみつアプリ💞</h1>
          <nav className="flex gap-4 text-pink-500 font-semibold">
            <Link href="/messages">ひとこと💬</Link>
            <Link href="/memories">思い出📸</Link>
            <Link href="/login">ログイン🔐</Link>
          </nav>
        </header>

        {/* メインコンテンツ */}
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
