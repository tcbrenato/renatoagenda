import { useEffect } from 'react';
import type { Task } from '@/lib/supabase';
import { todayISO } from '@/lib/categories';

const DAILY_NOTIF_KEY = 'renatoagenda_daily_notif_';

export function useTaskNotifications(tasks: Task[]) {
  // Ask for permission once, on first load.
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Daily summary notification — once per day, when tasks are loaded.
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (tasks.length === 0) return;

    const today = todayISO();
    const key = DAILY_NOTIF_KEY + today;
    if (sessionStorage.getItem(key)) return;

    const todayTasks = tasks.filter((t) => t.date === today && !t.completed);
    if (todayTasks.length === 0) return;

    sessionStorage.setItem(key, 'true');
    new Notification('RenatoAgenda — Programme du jour', {
      body:
        todayTasks.length === 1
          ? `1 tâche aujourd'hui : ${todayTasks[0].title}`
          : `${todayTasks.length} tâches aujourd'hui, dont « ${todayTasks[0].title} »`,
    });
  }, [tasks]);

  // Time-based reminders — notify ~10 min before a task's scheduled time (while the tab stays open).
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const today = todayISO();
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const t of tasks) {
      if (t.completed || t.date !== today || !t.time) continue;
      const [h, m] = t.time.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      const reminderTime = target.getTime() - 10 * 60 * 1000;
      const delay = reminderTime - Date.now();
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;

      const timer = setTimeout(() => {
        new Notification('RenatoAgenda — Rappel', {
          body: `« ${t.title} » dans 10 minutes${t.location ? ` — ${t.location}` : ''}`,
        });
      }, delay);
      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, [tasks]);
}
