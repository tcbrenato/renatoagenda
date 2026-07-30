import { useMemo } from 'react';
import { AlertCircle, CalendarClock, CircleDashed, CheckCircle2, ArrowRight, MapPin, Clock, Users } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import {
  CATEGORIES,
  CATEGORY_META,
  categorize,
  relativeDayLabel,
  formatLongDate,
  toISODate,
} from '@/lib/categories';

type Props = {
  tasks: Task[];
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onJumpCalendar: (date: string) => void;
};

const ICONS = {
  urgent: AlertCircle,
  upcoming: CalendarClock,
  other: CircleDashed,
  done: CheckCircle2,
} as const;

export default function Dashboard({ tasks, onToggle, onEdit, onDelete, onJumpCalendar }: Props) {
  const groups = useMemo(() => {
    const g: Record<string, Task[]> = { urgent: [], upcoming: [], other: [], done: [] };
    for (const t of tasks) g[categorize(t)].push(t);
    const byDate = (a: Task, b: Task) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : (a.time ?? '99').localeCompare(b.time ?? '99');
    g.urgent.sort(byDate);
    g.upcoming.sort(byDate);
    g.other.sort(byDate);
    g.done.sort(byDate).reverse();
    return g;
  }, [tasks]);

  const todayIso = toISODate(new Date());
  const todays = (groups.urgent.filter((t) => t.date === todayIso));

  return (
    <div className="space-y-6">
      {/* Today highlight */}
      <section className="overflow-hidden rounded-3xl border border-[#0100ad]/15 bg-gradient-to-br from-[#0100ad] to-[#2a2aff] p-5 text-white shadow-lg shadow-[#0100ad]/20 sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">Aujourd'hui</p>
            <h2 className="mt-1 text-2xl font-extrabold capitalize sm:text-3xl">
              {formatLongDate(todayIso)}
            </h2>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-2 text-center backdrop-blur">
            <p className="text-3xl font-extrabold leading-none">{todays.length}</p>
            <p className="mt-1 text-[11px] text-white/70">programme(s)</p>
          </div>
        </div>
        {todays.length > 0 ? (
          <div className="mt-5 space-y-2">
            {todays.map((t) => (
              <button
                key={t.id}
                onClick={() => onEdit(t)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left backdrop-blur transition hover:bg-white/20"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(t);
                  }}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    t.completed ? 'border-emerald-300 bg-emerald-400' : 'border-white/60'
                  }`}
                >
                  {t.completed && <CheckCircle2 size={12} className="text-white" />}
                </button>
                <span className={`flex-1 truncate font-medium ${t.completed ? 'text-white/60 line-through' : ''}`}>
                  {t.title}
                </span>
                {t.time && (
                  <span className="flex items-center gap-1 text-xs text-white/70">
                    <Clock size={12} /> {t.time}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
            Aucune tâche prévue aujourd'hui. Profitez-en ou anticipez demain.
          </p>
        )}
      </section>

      {/* Category columns */}
      <div className="grid gap-5 lg:grid-cols-2">
        {(['urgent', 'upcoming', 'other', 'done'] as const).map((key) => {
          const cat = CATEGORIES[key];
          const meta = CATEGORY_META[key];
          const Icon = ICONS[key];
          const list = groups[key] ?? [];
          return (
            <section
              key={key}
              className={`rounded-3xl border ${cat.ring} ${cat.soft} p-4 sm:p-5`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white ${cat.text} shadow-sm`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cat.label}</h3>
                    <p className="text-[11px] text-slate-500">{meta.hint}</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                <p className="rounded-xl bg-white/50 px-3 py-4 text-center text-xs text-slate-400">
                  Aucune tâche
                </p>
              ) : (
                <ul className="space-y-2">
                  {list.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <div className="group flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm transition hover:shadow-md">
                        <button
                          onClick={() => onToggle(t)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            t.completed
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 hover:border-[#0100ad]'
                          }`}
                        >
                          {t.completed && <CheckCircle2 size={11} strokeWidth={3} />}
                        </button>
                        <button
                          onClick={() => onEdit(t)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className={`truncate text-sm font-medium ${t.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {t.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                            <span className={`font-medium ${cat.text}`}>{relativeDayLabel(t.date)}</span>
                            {t.time && <span className="flex items-center gap-0.5"><Clock size={10} /> {t.time}</span>}
                            {t.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {t.location}</span>}
                            {t.participants && <span className="flex items-center gap-0.5"><Users size={10} /> {t.participants}</span>}
                          </div>
                        </button>
                        <button
                          onClick={() => onDelete(t)}
                          className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                          aria-label="Supprimer"
                        >
                          <AlertCircle size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                  {list.length > 6 && (
                    <li>
                      <button
                        onClick={() => onJumpCalendar(list[6].date)}
                        className="flex w-full items-center justify-center gap-1 rounded-xl bg-white/60 py-2 text-xs font-medium text-slate-500 transition hover:bg-white"
                      >
                        Voir {list.length - 6} de plus <ArrowRight size={12} />
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
