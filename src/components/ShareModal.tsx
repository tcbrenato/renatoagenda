import { useMemo, useState } from 'react';
import { X, FileText, Mail, MessageCircle, Calendar, CalendarDays, CalendarRange, CheckSquare, Square, Download } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { toISODate, parseDate, formatLongDate, CATEGORIES, categorize } from '@/lib/categories';
import { generateAgendaPDF, filterTasksForPeriod, type SharePeriod } from '@/lib/pdf';

type Props = {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
};

const PERIODS: { key: SharePeriod; label: string; icon: typeof Calendar; desc: string }[] = [
  { key: 'today', label: "Aujourd'hui", icon: Calendar, desc: 'Le jour même' },
  { key: 'week', label: 'Cette semaine', icon: CalendarRange, desc: 'Du lundi au dimanche' },
  { key: 'month', label: 'Ce mois', icon: CalendarDays, desc: 'Tout le mois courant' },
  { key: 'selected', label: 'Jours sélectionnés', icon: CheckSquare, desc: 'Choisissez des dates' },
];

export default function ShareModal({ open, onClose, tasks }: Props) {
  const [period, setPeriod] = useState<SharePeriod>('today');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [recipient, setRecipient] = useState('');
  const [sent, setSent] = useState<'mail' | 'whatsapp' | null>(null);

  const preview = useMemo(() => {
    const list = filterTasksForPeriod(tasks, period, selectedDates);
    const grouped = new Map<string, Task[]>();
    for (const t of list) {
      if (!grouped.has(t.date)) grouped.set(t.date, []);
      grouped.get(t.date)!.push(t);
    }
    return { list, grouped, count: list.length };
  }, [tasks, period, selectedDates]);

  if (!open) return null;

  function toggleDate(iso: string) {
    setSelectedDates((d) => (d.includes(iso) ? d.filter((x) => x !== iso) : [...d, iso]));
  }

  function buildPDF() {
    return generateAgendaPDF(tasks, period, selectedDates);
  }

  function download() {
    const doc = buildPDF();
    doc.save('renato-agenda.pdf');
  }

  function shareMail() {
    const doc = buildPDF();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const subject = encodeURIComponent('Mon agenda Renato — partage');
    const body = encodeURIComponent(
      `Bonjour,\n\nVoici mon agenda partagé (${periodLabel()}).\nLe PDF est en pièce jointe.\n\n— Renato Agenda`,
    );
    // Open mail client; attachment via blob isn't supported by mailto, so we download + open mail
    download();
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setSent('mail');
    setTimeout(() => setSent(null), 2500);
  }

  function shareWhatsApp() {
    const doc = buildPDF();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    // Download the PDF, then open WhatsApp with a message
    download();
    const text = encodeURIComponent(
      `Bonjour ! Je partage mon agenda Renato (${periodLabel()}). Le PDF est téléchargé, je vous l'envoie ici.`,
    );
    const waUrl = recipient ? `https://wa.me/${recipient.replace(/[^0-9]/g, '')}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setSent('whatsapp');
    setTimeout(() => setSent(null), 2500);
  }

  function periodLabel(): string {
    return PERIODS.find((p) => p.key === period)?.label ?? '';
  }

  // Build date list for "selected" mode — show next 31 days for quick picking
  const dateOptions = useMemo(() => {
    const arr: string[] = [];
    const base = new Date();
    for (let i = -7; i <= 31; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(toISODate(d));
    }
    return arr;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#0100ad]" />
            <h2 className="text-lg font-bold text-slate-900">Partager l'agenda (PDF)</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Period selection */}
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Période</p>
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            {PERIODS.map((p) => {
              const Icon = p.icon;
              const active = period === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-[#0100ad] bg-[#0100ad]/5 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#0100ad] text-white' : 'bg-white text-slate-400'}`}>
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-[#0100ad]' : 'text-slate-700'}`}>{p.label}</p>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected dates picker */}
          {period === 'selected' && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-slate-600">
                Sélectionnez les jours ({selectedDates.length} choisi{selectedDates.length > 1 ? 's' : ''}) :
              </p>
              <div className="grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-4">
                {dateOptions.map((iso) => {
                  const sel = selectedDates.includes(iso);
                  const d = parseDate(iso);
                  return (
                    <button
                      key={iso}
                      onClick={() => toggleDate(iso)}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition ${
                        sel ? 'bg-[#0100ad] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sel ? <CheckSquare size={12} /> : <Square size={12} />}
                      <span>{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Aperçu du PDF</p>
              <span className="rounded-full bg-[#0100ad]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0100ad]">
                {preview.count} tâche(s)
              </span>
            </div>
            {preview.count === 0 ? (
              <p className="text-center text-sm text-slate-400">Aucune tâche sur cette période.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {[...preview.grouped.entries()].map(([date, dayTasks]) => (
                  <div key={date}>
                    <p className="mb-1 text-xs font-bold capitalize text-slate-500">
                      {formatLongDate(date)}
                    </p>
                    {dayTasks.map((t) => {
                      const cat = CATEGORIES[categorize(t)];
                      return (
                        <div key={t.id} className="flex items-center gap-2 py-0.5 text-sm">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${cat.dot}`} />
                          {t.time && <span className="text-xs text-slate-400">{t.time}</span>}
                          <span className={`truncate ${t.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {t.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recipient */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Destinataire (optionnel)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Email ou numéro WhatsApp (ex : +229…)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0100ad] focus:bg-white focus:shadow-[0_0_0_3px_rgba(1,0,173,.1)]"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={download}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Download size={18} className="text-slate-500" />
              Télécharger
            </button>
            <button
              onClick={shareMail}
              className="flex flex-col items-center gap-1 rounded-xl bg-[#0100ad] px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0000c8]"
            >
              <Mail size={18} />
              {sent === 'mail' ? 'Envoyé !' : 'Par Email'}
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1 rounded-xl bg-emerald-500 px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
            >
              <MessageCircle size={18} />
              {sent === 'whatsapp' ? 'Ouvert !' : 'WhatsApp'}
            </button>
          </div>
          <p className="mt-2.5 text-center text-[11px] text-slate-400">
            Le PDF est téléchargé puis votre messagerie s'ouvre pour l'envoyer en pièce jointe.
          </p>
        </div>
      </div>
    </div>
  );
}
