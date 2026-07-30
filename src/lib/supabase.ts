import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  time: string | null; // HH:mm
  location: string | null;
  participants: string | null;
  description: string | null;
  completed: boolean;
  custom_fields: Record<string, string> | null;
  created_at: string;
};

export type TaskInput = Omit<Task, 'id' | 'created_at' | 'completed'> & {
  completed?: boolean;
};

export type CustomFieldDef = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'select';
  options?: string[];
};

export type StandardFieldKey =
  | 'title'
  | 'date'
  | 'time'
  | 'location'
  | 'participants'
  | 'description';

export type AppSettings = {
  enabledFields: StandardFieldKey[];
  customFields: CustomFieldDef[];
};

export const DEFAULT_ENABLED_FIELDS: StandardFieldKey[] = [
  'title',
  'date',
  'time',
  'location',
  'participants',
  'description',
];

export const FIELD_LABELS: Record<StandardFieldKey, string> = {
  title: 'Titre',
  date: 'Date',
  time: 'Heure',
  location: 'Lieu',
  participants: 'Avec qui',
  description: 'Description',
};
