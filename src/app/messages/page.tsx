'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<{ id: string; message: string; created_at: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // 🚀 メッセージ取得（関数宣言に変更）
  async function loadMessages(uid: string) {
    const { data, error } = await supabase
      .from('daily_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('user_id', uid);

    if (!error) setMessages(data ?? []);
  }

  // 🚀 ログインユーザー取得＆初回ロード
  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        alert('ユーザー情報の取得に失敗💦');
        return;
      }
      if (user) {
        setUserId(user.id);
        await loadMessages(user.id); // 関数はすでに宣言済み
      }
    })();
  }, []);

  // 💌 メッセージ送信
  const handleSendMessage = async () => {
    if (!newMessage || !userId) return;

    const { error } = await supabase
      .from('daily_messages')
      .insert([{ id: uuidv4(), user_id: userId, message: newMessage }]);

    if (!error) {
      setNewMessage('');
      await loadMessages(userId);
    } else {
      alert('送信失敗💦 ' + error.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-6 p-6 bg-pink-50">
      {/* ナビゲーション */}
      <nav className="flex gap-4 mb-4">
        <button
          onClick={() => router.push('/messages')}
          className="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500"
        >
          ひとこと
        </button>
        <button
          onClick={() => router.push('/memories')}
          className="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500"
        >
          思い出
        </button>
      </nav>
<h1 className="text-2xl font-bold text-pink-500">ひとこと💌</h1>

<div className="flex gap-2 w-full max-w-md">
  <input
    type="text"
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    className="flex-1 border rounded px-2 py-1 text-black"
    placeholder="今日のひとこと"
  />
  <button
    onClick={handleSendMessage}
    className="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500"
  >
    送信
  </button>
</div>

<ul className="flex flex-col gap-2 w-full max-w-md">
  {messages.map((m) => (
    <li key={m.id} className="bg-pink-100 rounded px-2 py-1 text-black">
      {m.message}{' '}
      <span className="text-xs text-pink-700">{new Date(m.created_at).toLocaleString()}</span>
    </li>
  ))}
</ul>

    </main>
  );
}
