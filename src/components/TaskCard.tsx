import { Clock, MapPin, Users, Pencil, Trash2, Check } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { CATEGORIES, relativeDayLabel, toISODate } from '@/lib/categories';

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  const today = toISODate(new Date());
  const key = task.completed
    ? 'done'
    : task.date < today
    ? 'urgent'
    : daysUntil(task.date) <= 7
    ? 'upcoming'
    : 'other';
  const cat = CATEGORIES[key];

  return (
    <div className={`group relative rounded-2xl border ${cat.ring} ${cat.soft} p-4 transition hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
            task.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-[#0100ad]'
          }`}
          aria-label={task.completed ? 'Rouvrir' : 'Terminer'}
        >
          {task.completed && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${cat.dot}`} />
            <h3 className={`truncate font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.title}
            </h3>
          </div>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {relativeDayLabel(task.date)}
            {task.time && <span className="ml-2 inline-flex items-center gap-1"><Clock size={12} /> {task.time}</span>}
          </p>

          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {task.location && (
              <p className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" /><span className="truncate">{task.location}</span></p>
            )}
            {task.participants && (
              <p className="flex items-start gap-1.5"><Users size={14} className="mt-0.5 shrink-0 text-slate-400" /><span className="truncate">{task.participants}</span></p>
            )}
          </div>

          {task.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{task.description}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={() => onEdit(task)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-[#0100ad]" aria-label="Modifier">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(task)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-500" aria-label="Supprimer">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
