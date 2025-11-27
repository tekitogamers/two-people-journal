// MemoriesPage with true Instagram-like swipe carousel ✨
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

// -------------------- Types --------------------
type MemoryImage = {
  id: string;
  memory_id: string;
  image_path: string;
  created_at: string;
};

type Memory = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  images: MemoryImage[];
};

export default function MemoriesPage() {
  const router = useRouter();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Active index per memory
  const [activeIndexes, setActiveIndexes] = useState<Record<string, number>>({});

  // Refs for snap-to-slide
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // -------------------- Snap Scrolling --------------------
  const handleScroll = (memoryId: string, e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const width = container.clientWidth;
    const index = Math.round(container.scrollLeft / width);
    setActiveIndexes((prev) => ({ ...prev, [memoryId]: index }));
  };

  // -------------------- Load Memories --------------------
  async function loadMemories(uid: string) {
    const { data: memoryData } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('user_id', uid);

    if (!memoryData) return;

    const { data: imageData } = await supabase
      .from('memory_images')
      .select('*')
      .in('memory_id', memoryData.map((m) => m.id));

    const safeImages = imageData ?? [];

    const merged: Memory[] = memoryData.map((m) => ({
      ...m,
      images: safeImages.filter((img) => img.memory_id === m.id),
    }));

    setMemories(merged);
  }

  // -------------------- Auth Init --------------------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      await loadMemories(data.user.id);
    })();
  }, []);

  // -------------------- Submit Memory --------------------
  const handleSendMemory = async () => {
    if (!userId) return;
    const memoryId = uuidv4();

    const { error: memErr } = await supabase.from('memories').insert([
      { id: memoryId, user_id: userId, title: newTitle, description: newDescription },
    ]);

    if (memErr) {
      alert(memErr.message);
      return;
    }

    for (const file of files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('couple-images')
        .upload(fileName, file);

      if (!uploadErr) {
        const { data } = supabase.storage.from('couple-images').getPublicUrl(fileName);
        await supabase.from('memory_images').insert([
          { id: uuidv4(), memory_id: memoryId, image_path: data.publicUrl },
        ]);
      }
    }

    setNewTitle('');
    setNewDescription('');
    setFiles([]);
    await loadMemories(userId);
  };

  // -------------------- Delete Memory --------------------
  const handleDeleteMemory = async (id: string) => {
    if (!userId) return;
    await supabase.from('memory_images').delete().eq('memory_id', id);
    await supabase.from('memories').delete().eq('id', id);
    await loadMemories(userId);
  };

  // -------------------- UI --------------------
  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-6 bg-pink-50">
      <h1 className="text-2xl font-bold text-pink-500">思い出📸</h1>

      {/* Upload Form */}
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
          placeholder="説明"
        />
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
          className="border rounded px-2 py-1 text-black"
        />
        <button
          onClick={handleSendMemory}
          className="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500"
        >
          投稿する
        </button>
      </div>

      {/* Memories List */}
      <ul className="flex flex-col gap-4 w-full max-w-md">
        {memories.map((m: Memory) => (
          <li key={m.id} className="bg-pink-100 rounded px-3 py-2 text-black shadow">
            <strong>{m.title}</strong>
            {m.description && <p className="text-sm mt-1 whitespace-pre-wrap">{m.description}</p>}

            {m.images.length > 0 && (
              <>
                {/* Dots */}
                <div className="flex justify-center gap-1 mt-2">
                  {m.images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        activeIndexes[m.id] === idx ? 'bg-pink-600 scale-110' : 'bg-pink-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Carousel */}
<div
  ref={(el) => {
    containerRefs.current[m.id] = el ?? null;
  }}
  className="mt-2 flex overflow-x-auto snap-x snap-mandatory w-full rounded-lg"
  style={{
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  }}
  onScroll={(e) => handleScroll(m.id, e)}
>
  {m.images.map((img: MemoryImage) => (
    <div key={img.id} className="snap-start flex-shrink-0 w-full h-64 relative">
      <img src={img.image_path} className="w-full h-full object-cover rounded-lg" />
    </div>
  ))}
</div>
              </>
            )}

            <div className="text-xs text-pink-700 mt-1">
              {new Date(m.created_at).toLocaleString()}
            </div>

            <button
              onClick={() => handleDeleteMemory(m.id)}
              className="mt-2 px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
