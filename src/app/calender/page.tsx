'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  getDay,
} from 'date-fns';

type Event = {
  id: string;
  title: string;
  note: string | null; // 補足事項
  start_time: string;
  end_time: string;
  date: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:00');

  // -------------------- Load Events --------------------
  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) return console.error(error.message);
    setEvents(data ?? []);
  };

useEffect(() => {
  (async () => {
    await loadEvents();
  })();
}, []);

  // -------------------- Open Modal --------------------
  const openModal = (date: Date, event?: Event) => {
    setSelectedDate(date);
    if (event) {
      setEditingEvent(event);
      setNewTitle(event.title);
      setNewNote(event.note ?? '');
      setNewStart(event.start_time);
      setNewEnd(event.end_time);
    } else {
      setEditingEvent(null);
      setNewTitle('');
      setNewNote('');
      setNewStart('09:00');
      setNewEnd('10:00');
    }
    setModalOpen(true);
  };

  // -------------------- Add or Update Event --------------------
  const handleSaveEvent = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    if (editingEvent) {
      const { error } = await supabase
        .from('events')
        .update({
          title: newTitle,
          note: newNote,
          start_time: newStart,
          end_time: newEnd,
        })
        .eq('id', editingEvent.id);

      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from('events').insert([
        {
          title: newTitle,
          note: newNote,
          date: dateStr,
          start_time: newStart,
          end_time: newEnd,
        },
      ]);
      if (error) return alert(error.message);
    }

    setModalOpen(false);
    loadEvents();
  };

  // -------------------- Delete Event --------------------
  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) return alert(error.message);
    setModalOpen(false);
    loadEvents();
  };

  // -------------------- Calendar Rendering --------------------
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-2">
      <h2 className="font-bold text-lg">{format(currentDate, 'MMMM yyyy')}</h2>
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentDate(addDays(currentDate, -30))}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          &lt;
        </button>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 30))}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          &gt;
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(start, i);
      const isWeekend = getDay(dayDate) === 0 || getDay(dayDate) === 6;
      days.push(
        <div
          key={i}
          className={`text-center font-bold ${isWeekend ? 'text-red-500' : 'text-black'}`}
        >
          {format(dayDate, 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let currentDay = startDate;

    while (currentDay <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayToRender = currentDay;
        const formattedDate = format(dayToRender, 'yyyy-MM-dd');
        const dayEvents = events.filter((e) => e.date === formattedDate);
        const isWeekend = getDay(dayToRender) === 0 || getDay(dayToRender) === 6;

        days.push(
          <div
            key={dayToRender.toString()}
            className={`border h-24 p-1 cursor-pointer ${
              !isSameMonth(dayToRender, currentDate) ? 'bg-gray-100' : 'bg-white'
            } ${isSameDay(dayToRender, selectedDate || new Date()) ? 'bg-pink-100' : ''}`}
            onClick={() => openModal(dayToRender)}
          >
            <div className={`text-sm ${isWeekend ? 'text-red-500' : 'text-black'}`}>
              {format(dayToRender, 'd')}
            </div>
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                className="text-xs bg-pink-200 rounded px-1 my-0.5 truncate text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(dayToRender, ev);
                }}
              >
                {ev.title} ({ev.start_time}-{ev.end_time}) {ev.note && `- ${ev.note}`}
              </div>
            ))}
          </div>
        );

        currentDay = addDays(currentDay, 1);
      }
      rows.push(
        <div key={currentDay.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="flex flex-col gap-1">{rows}</div>;
  };

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-pink-500 mb-4">カレンダー📅</h1>
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      {/* Modal */}
      {modalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 w-80">
            <h2 className="font-bold mb-2">
              {format(selectedDate, 'yyyy-MM-dd')} {editingEvent ? '予定編集' : '予定追加'}
            </h2>
            <input
              type="text"
              placeholder="タイトル"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-2 text-black"
            />
            <textarea
              placeholder="補足事項"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-2 text-black"
              rows={3}
            />
            <div className="flex gap-2 mb-2">
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="border rounded px-2 py-1 w-1/2 text-black"
              />
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="border rounded px-2 py-1 w-1/2 text-black"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              {editingEvent && (
                <button
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500"
                >
                  削除
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                className="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500"
              >
                {editingEvent ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
