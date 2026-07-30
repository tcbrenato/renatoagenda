import type { Task } from '@/lib/supabase';

export type CategoryKey = 'urgent' | 'upcoming' | 'other' | 'done';

export type Category = {
  key: CategoryKey;
  label: string;
  dot: string; // tailwind bg class for the colored dot
  ring: string; // tailwind border class for accents
  text: string; // tailwind text color
  soft: string; // soft background tint
};

export const CATEGORIES: Record<CategoryKey, Category> = {
  urgent: {
    key: 'urgent',
    label: 'Urgent',
    dot: 'bg-red-500',
    ring: 'border-red-200',
    text: 'text-red-600',
    soft: 'bg-red-50',
  },
  upcoming: {
    key: 'upcoming',
    label: 'À venir',
    dot: 'bg-amber-400',
    ring: 'border-amber-200',
    text: 'text-amber-600',
    soft: 'bg-amber-50',
  },
  other: {
    key: 'other',
    label: 'Autres',
    dot: 'bg-slate-300',
    ring: 'border-slate-200',
    text: 'text-slate-500',
    soft: 'bg-slate-50',
  },
  done: {
    key: 'done',
    label: 'Terminé',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200',
    text: 'text-emerald-600',
    soft: 'bg-emerald-50',
  },
};

export const CATEGORY_ORDER: CategoryKey[] = ['urgent', 'upcoming', 'other', 'done'];

export const CATEGORY_META: Record<CategoryKey, { emoji: string; hint: string }> = {
  urgent: { emoji: '🔴', hint: "Aujourd'hui ou en retard" },
  upcoming: { emoji: '🟡', hint: 'Dans les 7 prochains jours' },
  other: { emoji: '⚪', hint: 'Plus lointain' },
  done: { emoji: '✅', hint: 'Marquées comme terminées' },
};

const MS_PER_DAY = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayDiff(iso: string): number {
  const today = startOfDay(new Date());
  const target = startOfDay(parseDate(iso));
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function categorize(task: Task): CategoryKey {
  if (task.completed) return 'done';
  const diff = dayDiff(task.date);
  if (diff <= 0) return 'urgent';
  if (diff <= 7) return 'upcoming';
  return 'other';
}

export function formatLongDate(iso: string): string {
  const d = parseDate(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const d = parseDate(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function relativeDayLabel(iso: string): string {
  const diff = dayDiff(iso);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff < 0) return `En retard de ${Math.abs(diff)} j`;
  if (diff <= 7) return `Dans ${diff} j`;
  return formatShortDate(iso);
}
