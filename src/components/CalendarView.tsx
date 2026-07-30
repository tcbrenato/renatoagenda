import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { toISODate, parseDate, formatLongDate, CATEGORIES, categorize } from '@/lib/categories';
import TaskCard from './TaskCard';

type Props = {
  tasks: Task[];
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  initialDate?: string;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function CalendarView({ tasks, onToggle, onEdit, onDelete, initialDate }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(toISODate(new Date()));

  useEffect(() => {
    if (!initialDate) return;
    const d = parseDate(initialDate);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(initialDate);
  }, [initialDate]);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return map;
  }, [tasks]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    // make Monday = index 0
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({ date: d, inMonth: d.getMonth() === month });
    }
    return cells;
  }, [cursor]);

  const todayIso = toISODate(new Date());
  const selectedTasks = byDate.get(selected) ?? [];

  function move(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => move(-1)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(toISODate(d));
              }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-[#0100ad] transition hover:bg-[#0100ad]/5"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => move(1)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Mois suivant"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-xs font-semibold text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map(({ date, inMonth }) => {
            const iso = toISODate(date);
            const dayTasks = byDate.get(iso) ?? [];
            const isToday = iso === todayIso;
            const isSelected = iso === selected;
            const pending = dayTasks.filter((t) => !t.completed).length;
            const hasUrgent = dayTasks.some((t) => categorize(t) === 'urgent');
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${
                  isSelected
                    ? 'bg-[#0100ad] text-white shadow-md'
                    : isToday
                    ? 'bg-[#0100ad]/10 text-[#0100ad] font-bold'
                    : inMonth
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span className="mt-0.5 flex gap-0.5">
                    {hasUrgent && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {dayTasks.some((t) => categorize(t) === 'upcoming') && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                    {dayTasks.some((t) => categorize(t) === 'other') && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    )}
                    {dayTasks.some((t) => t.completed) && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {isSelected && (
                      <span className="text-[10px] font-semibold">{dayTasks.length}</span>
                    )}
                  </span>
                )}
                {!isSelected && pending > 0 && dayTasks.length > 0 && (
                  <span className="sr-only">{pending} tâche(s)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-[#0100ad]" />
          <h2 className="text-lg font-bold capitalize text-slate-900">
            {formatLongDate(selected)}
          </h2>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center text-sm text-slate-400">
            Aucune tâche ce jour-là.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTasks
              .sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))
              .map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
