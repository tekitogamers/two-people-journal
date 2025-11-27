'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('ログイン失敗💦: ' + error.message);
    } else {
      alert('ログイン成功💖');
      router.push('/messages'); // 成功したらひとこと画面へ
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-pink-50">
      <h1 className="text-2xl font-bold">ログイン💌</h1>

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-2 py-1 w-64"
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-2 py-1 w-64"
      />
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500"
      >
        ログイン
      </button>
    </main>
  );
}
