'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

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

type ContainerRefs = {
  [key: string]: HTMLDivElement | null;
};

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeIndexes, setActiveIndexes] = useState<Record<string, number>>({});
  const containerRefs = useRef<ContainerRefs>({});

  // -------------------- Image Modal --------------------
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalMemoryId, setModalMemoryId] = useState<string | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [{ x, y, scale }, api] = useSpring(() => ({ x: 0, y: 0, scale: 1 }));

  const bind = useGesture(
    {
      onDrag: ({ offset: [dx, dy], last, memo }) => {
        if (!memo) memo = { startX: dx };
        const deltaX = dx - memo.startX;

        api.start({ x: dx, y: dy });

        if (last) {
          // 横スワイプで左右切替
          if (Math.abs(deltaX) > 50 && modalMemoryId !== null) {
            const memory = memories.find((m) => m.id === modalMemoryId);
            if (memory) {
              if (deltaX < 0 && modalIndex < memory.images.length - 1) {
                setModalIndex(modalIndex + 1);
              } else if (deltaX > 0 && modalIndex > 0) {
                setModalIndex(modalIndex - 1);
              }
            }
          }
          // 縦スワイプで閉じる
          if (Math.abs(dy) > 200) {
            setImageModalOpen(false);
            setModalMemoryId(null);
            api.start({ x: 0, y: 0, scale: 1 });
          }
          api.start({ x: 0, y: 0 });
        }

        return memo;
      },
      onPinch: ({ offset: [d] }) => {
        api.start({ scale: 1 + d / 200 });
      },
    },
    { drag: { from: () => [x.get(), y.get()] }, pinch: { scaleBounds: { min: 1, max: 3 } } }
  );

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      await loadMemories(data.user.id);
    })();
  }, []);

  const handleSendMemory = async () => {
    if (!userId) return;
    const memoryId = uuidv4();

    const { error: memErr } = await supabase.from('memories').insert([
      { id: memoryId, user_id: userId, title: newTitle, description: newDescription },
    ]);
    if (memErr) return alert(memErr.message);

    for (const file of files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('couple-images').upload(fileName, file);
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
        {memories.map((m) => (
          <li key={m.id} className="bg-pink-100 rounded px-3 py-2 text-black shadow">
            <strong>{m.title}</strong>
            {m.description && <p className="text-sm mt-1 whitespace-pre-wrap">{m.description}</p>}

            {m.images.length > 0 && (
              <>
                <div className="flex justify-center gap-1 mt-2">
                  {m.images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === (activeIndexes[m.id] ?? 0) ? 'bg-pink-600 scale-110' : 'bg-pink-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Carousel */}
                <div
                  ref={(el) => {
                    containerRefs.current[m.id] = el ?? null;
                  }}
                  className="flex overflow-x-auto snap-x snap-mandatory w-full rounded-lg"
                  style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const index = Math.round(container.scrollLeft / container.clientWidth);
                    setActiveIndexes((prev) => ({ ...prev, [m.id]: index }));
                  }}
                >
                  {m.images.map((img, idx) => (
                    <div key={img.id} className="snap-start flex-shrink-0 w-full h-64 relative">
                      <img
                        src={img.image_path}
                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          setModalMemoryId(m.id);
                          setModalIndex(idx);
                          setModalImage(img.image_path);
                          setImageModalOpen(true);
                          api.start({ x: 0, y: 0, scale: 1 });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="text-xs text-pink-700 mt-1">{new Date(m.created_at).toLocaleString()}</div>

            <button
              onClick={() => handleDeleteMemory(m.id)}
              className="mt-2 px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500"
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      {/* Image Modal */}
      {imageModalOpen && modalMemoryId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <animated.div
            {...bind()}
            className="relative touch-none w-full max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            style={{ x, y, scale }}
          >
            {memories
              .find((m) => m.id === modalMemoryId)
              ?.images.map((img, idx) =>
                idx === modalIndex ? (
                  <img key={img.id} src={img.image_path} className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
                ) : null
              )}
            <button
              className="absolute top-2 right-2 text-white text-2xl font-bold"
              onClick={() => {
                setImageModalOpen(false);
                setModalMemoryId(null);
                api.start({ x: 0, y: 0, scale: 1 });
              }}
            >
              ×
            </button>
          </animated.div>
        </div>
      )}
    </main>
  );
}
