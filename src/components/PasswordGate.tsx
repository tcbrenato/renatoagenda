import { FormEvent, useState } from 'react';
import { CalendarDays, Lock } from 'lucide-react';

const APP_PASSWORD = 'TCB2026';
const STORAGE_KEY = 'renatoagenda_unlocked';

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'true');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value === APP_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setValue('');
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0100ad] text-white shadow-md shadow-[#0100ad]/30">
          <CalendarDays size={22} />
        </div>
        <h1 className="text-center text-lg font-extrabold text-slate-900">
          Renato<span className="text-[#0100ad]"> Agenda</span>
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">Accès protégé</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Mot de passe"
              className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition ${
                error
                  ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]'
                  : 'border-slate-200 focus:border-[#0100ad] focus:shadow-[0_0_0_3px_rgba(1,0,173,.1)]'
              }`}
            />
          </div>
          {error && <p className="text-xs font-medium text-red-500">Mot de passe incorrect.</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#0100ad] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0100ad]/25 transition hover:bg-[#0000c8]"
          >
            Déverrouiller
          </button>
        </form>
      </div>
    </div>
  );
}
