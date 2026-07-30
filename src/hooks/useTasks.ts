import { useEffect, useState } from 'react';
import { supabase, type Task } from '@/lib/supabase';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: false });
    if (error) setError(error.message);
    else setTasks((data as Task[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return { tasks, loading, error, refresh };
}
