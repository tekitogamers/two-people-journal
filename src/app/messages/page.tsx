'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<{ id: string; message: string; created_at: string; user_id: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // 🚀 メッセージ取得
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
        await loadMessages(user.id);
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

  // 🗑️ メッセージ削除（自分の投稿のみ）
  const handleDeleteMessage = async (id: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('daily_messages')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // 自分の投稿のみ削除

    if (!error) {
      await loadMessages(userId);
    } else {
      alert('削除失敗💦 ' + error.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-6 p-6 bg-pink-50">
      <h1 className="text-2xl font-bold text-pink-500">ひとこと💌</h1>
        <div className="flex flex-col w-full max-w-md gap-2">
        <textarea
            value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full border rounded px-2 py-1 text-black resize-none"
                placeholder="今日のひとこと"
                maxLength={300} // 文字上限300
                rows={3} 
                />
                {/* 文字数カウント */}
                <div className="text-right text-sm text-pink-700">
                  {newMessage.length} / 300
                </div>
                <button
                    onClick={handleSendMessage}
                    className="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500"
                >
                    送信
                </button>
        </div>
{/* 投稿表示部分 */}
<ul className="flex flex-col gap-2 w-full max-w-md">
  {messages.map((m) => (
    <li
      key={m.id}
      className="bg-pink-100 rounded px-2 py-1 text-black flex justify-between items-start"
    >
      {/* メッセージ部分（改行反映） */}
      <div className="whitespace-pre-wrap">
        {m.message}
        <div className="text-xs text-pink-700 mt-1">
          {new Date(m.created_at).toLocaleString()}
        </div>
      </div>

      {/* 自分の投稿なら削除ボタン表示 */}
      {m.user_id === userId && (
        <button
          onClick={() => handleDeleteMessage(m.id)}
          className="ml-2 px-2 py-0.5 bg-red-400 text-white rounded hover:bg-red-500 text-xs"
        >
          削除
        </button>
      )}
    </li>
  ))}
</ul>
    </main>
  );
}
