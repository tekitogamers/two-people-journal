'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

export default function MemoriesPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<{ id: string; title: string; description: string | null; image_path: string | null; created_at: string; user_id: string }[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 🚀 メモリー取得
  async function loadMemories(uid: string) {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('user_id', uid);

    if (!error) setMemories(data ?? []);
  }

  // 🚀 ログインユーザー取得＆初回ロード
  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return;
      if (user) {
        setUserId(user.id);
        await loadMemories(user.id);
      }
    })();
  }, []);

  // 💌 メモリー送信（タイトル＋説明＋画像）
  const handleSendMemory = async () => {
    if (!userId) return;

    let imagePath: string | null = null;

    if (file) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('couple-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        alert('画像アップロード失敗💦 ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('couple-images').getPublicUrl(fileName);
      imagePath = data.publicUrl;
    }

    const { error } = await supabase
      .from('memories')
      .insert([{
        id: uuidv4(),
        user_id: userId,
        title: newTitle,
        description: newDescription,
        image_path: imagePath
      }]);

    if (!error) {
      setNewTitle('');
      setNewDescription('');
      setFile(null);
      await loadMemories(userId);
    } else {
      alert('送信失敗💦 ' + error.message);
    }
  };

  // 🗑 投稿削除
  const handleDeleteMemory = async (id: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // 自分の投稿だけ削除可能

    if (!error) {
      await loadMemories(userId);
    } else {
      alert('削除失敗💦 ' + error.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-6 p-6 bg-pink-50">
      <h1 className="text-2xl font-bold text-pink-500">思い出📸</h1>

      <div className="flex flex-col gap-2 w-full max-w-md">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="border rounded px-2 py-1 text-black"
          placeholder="タイトル"
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="border rounded px-2 py-1 text-black"
          placeholder="説明や感想"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="border rounded px-2 py-1 text-black"
        />
        <button
          onClick={handleSendMemory}
          className="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500"
        >
          送信
        </button>
      </div>

      <ul className="flex flex-col gap-2 w-full max-w-md">
        {memories.map((m) => (
          <li key={m.id} className="bg-pink-100 rounded px-2 py-1 text-black">
            <strong>{m.title}</strong>
            {m.description && <p className="text-sm mt-1">{m.description}</p>}
            {m.image_path && <img src={m.image_path} alt="Memory" className="w-full max-w-md mt-2 rounded shadow object-contain" />}
            <div className="text-xs text-pink-700 mt-1">{new Date(m.created_at).toLocaleString()}</div>

            {/* 自分の投稿だけ削除ボタンを表示 */}
            {m.user_id === userId && (
              <button
                onClick={() => handleDeleteMemory(m.id)}
                className="mt-2 px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500"
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
