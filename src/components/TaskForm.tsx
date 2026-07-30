import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase, type Task, type CustomFieldDef, type StandardFieldKey } from '@/lib/supabase';
import { todayISO } from '@/lib/categories';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: Task | null;
  enabledFields?: StandardFieldKey[];
  customFields?: CustomFieldDef[];
};

type FormState = Record<string, string>;

const STANDARD_KEYS: StandardFieldKey[] = [
  'title',
  'date',
  'time',
  'location',
  'participants',
  'description',
];

const FIELD_LABELS: Record<StandardFieldKey, string> = {
  title: 'Titre',
  date: 'Date',
  time: 'Heure',
  location: 'Lieu',
  participants: 'Avec qui',
  description: 'Description',
};

export default function TaskForm({
  open,
  onClose,
  onSaved,
  editing,
  enabledFields = STANDARD_KEYS,
  customFields = [],
}: Props) {
  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const enabled = new Set(enabledFields);

  function empty(): FormState {
    const base: FormState = { title: '', date: todayISO(), time: '', location: '', participants: '', description: '' };
    for (const cf of customFields) base[cf.id] = '';
    return base;
  }

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (editing) {
      const next: FormState = {
        title: editing.title,
        date: editing.date,
        time: editing.time ?? '',
        location: editing.location ?? '',
        participants: editing.participants ?? '',
        description: editing.description ?? '',
      };
      for (const cf of customFields) next[cf.id] = editing.custom_fields?.[cf.id] ?? '';
      setForm(next);
    } else {
      setForm(empty());
    }
  }, [open, editing, customFields]);

  if (!open) return null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    if (!form.title?.trim() || !form.date) {
      setErr('Le titre et la date sont obligatoires.');
      setSaving(false);
      return;
    }
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      date: form.date,
    };
    if (enabled.has('time')) payload.time = form.time || null;
    if (enabled.has('location')) payload.location = form.location?.trim() || null;
    if (enabled.has('participants')) payload.participants = form.participants?.trim() || null;
    if (enabled.has('description')) payload.description = form.description?.trim() || null;

    const customData: Record<string, string> = {};
    for (const cf of customFields) {
      const v = form[cf.id];
      if (v !== undefined && v !== '') customData[cf.id] = v;
    }
    payload.custom_fields = Object.keys(customData).length ? customData : null;

    let res;
    if (editing) res = await supabase.from('tasks').update(payload).eq('id', editing.id);
    else res = await supabase.from('tasks').insert(payload);
    if (res.error) {
      setErr(res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl animate-pop-in max-h-[92vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {editing ? 'Modifier' : 'Nouveau programme'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Title + Date always */}
          <Field label="Titre" required>
            <input
              type="text"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              required
              placeholder="Ex : Rendez-vous dentiste"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <input
                type="date"
                value={form.date ?? ''}
                onChange={(e) => set('date', e.target.value)}
                required
                className="input"
              />
            </Field>
            {enabled.has('time') && (
              <Field label="Heure">
                <input
                  type="time"
                  value={form.time ?? ''}
                  onChange={(e) => set('time', e.target.value)}
                  className="input"
                />
              </Field>
            )}
          </div>

          {enabled.has('location') && (
            <Field label="Lieu">
              <input
                type="text"
                value={form.location ?? ''}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Ex : Cabinet médical, 12 rue de la Paix"
                className="input"
              />
            </Field>
          )}

          {enabled.has('participants') && (
            <Field label="Avec qui">
              <input
                type="text"
                value={form.participants ?? ''}
                onChange={(e) => set('participants', e.target.value)}
                placeholder="Ex : Marie, Paul"
                className="input"
              />
            </Field>
          )}

          {enabled.has('description') && (
            <Field label="Description">
              <textarea
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Détails, notes, ordre du jour…"
                className="input resize-none"
              />
            </Field>
          )}

          {/* Custom fields */}
          {customFields.map((cf) => (
            <Field key={cf.id} label={cf.label}>
              <input
                type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : cf.type === 'time' ? 'time' : 'text'}
                value={form[cf.id] ?? ''}
                onChange={(e) => set(cf.id, e.target.value)}
                className="input"
              />
            </Field>
          ))}

          {err && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#0100ad] px-4 py-3 font-semibold text-white shadow-lg shadow-[#0100ad]/25 transition hover:bg-[#0000c8] disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.7rem 0.85rem;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .input:focus {
          border-color: #0100ad;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(1,0,173,.12);
        }
        .input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-[#0100ad]"> *</span>}
      </span>
      {children}
    </label>
  );
}
