import { useState } from 'react';
import { X, Plus, Trash2, Settings as SettingsIcon, Plug, GripVertical, Check } from 'lucide-react';
import type { AppSettings, CustomFieldDef, StandardFieldKey } from '@/lib/supabase';
import { FIELD_LABELS } from '@/lib/supabase';

type Props = {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
};

const ALL_STANDARD_FIELDS: StandardFieldKey[] = [
  'title',
  'date',
  'time',
  'location',
  'participants',
  'description',
];

const CONNECTORS = [
  { id: 'google', name: 'Google Calendar', desc: 'Synchroniser les tâches avec Google Calendar', color: 'bg-blue-500' },
  { id: 'outlook', name: 'Outlook Calendar', desc: 'Synchroniser avec Microsoft Outlook', color: 'bg-sky-600' },
  { id: 'apple', name: 'Apple Calendar', desc: 'Synchroniser avec iCloud / Apple Calendar', color: 'bg-slate-800' },
  { id: 'slack', name: 'Slack', desc: 'Recevoir les rappels de tâches sur Slack', color: 'bg-purple-500' },
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Notifications de rappel via WhatsApp', color: 'bg-emerald-500' },
  { id: 'notion', name: 'Notion', desc: 'Exporter les tâches vers Notion', color: 'bg-slate-700' },
];

export default function SettingsSidebar({ open, onClose, settings, onSave }: Props) {
  const [enabled, setEnabled] = useState<StandardFieldKey[]>(settings.enabledFields);
  const [custom, setCustom] = useState<CustomFieldDef[]>(settings.customFields);
  const [connected, setConnected] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldDef['type']>('text');
  const [saved, setSaved] = useState(false);

  // Sync when reopened
  useState(() => {
    setEnabled(settings.enabledFields);
    setCustom(settings.customFields);
  });

  function toggleStandard(key: StandardFieldKey) {
    if (key === 'title' || key === 'date') return; // mandatory
    setEnabled((e) => (e.includes(key) ? e.filter((k) => k !== key) : [...e, key]));
  }

  function addCustom() {
    if (!newLabel.trim()) return;
    const id = `cf_${Date.now()}`;
    setCustom((c) => [...c, { id, label: newLabel.trim(), type: newType }]);
    setNewLabel('');
    setNewType('text');
  }

  function removeCustom(id: string) {
    setCustom((c) => c.filter((f) => f.id !== id));
  }

  function toggleConnector(id: string) {
    setConnected((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function handleSave() {
    onSave({ enabledFields: enabled, customFields: custom });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <SettingsIcon size={18} className="text-[#0100ad]" />
            <h2 className="text-lg font-bold text-slate-900">Paramètres</h2>
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
          {/* Form fields */}
          <section className="mb-7">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
              Champs du formulaire
            </h3>
            <p className="mb-3 text-xs text-slate-400">
              Activez ou désactivez les champs affichés dans le formulaire de création.
            </p>
            <div className="space-y-2">
              {ALL_STANDARD_FIELDS.map((key) => {
                const on = enabled.includes(key);
                const locked = key === 'title' || key === 'date';
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                      on ? 'border-[#0100ad]/30 bg-[#0100ad]/5' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className={locked ? 'text-slate-300' : 'text-slate-400'} />
                      <span className="text-sm font-medium text-slate-700">{FIELD_LABELS[key]}</span>
                      {locked && (
                        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          requis
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleStandard(key)}
                      disabled={locked}
                      className={`relative h-6 w-11 rounded-full transition ${
                        on ? 'bg-[#0100ad]' : 'bg-slate-300'
                      } ${locked ? 'opacity-50' : ''}`}
                      aria-label={on ? 'Désactiver' : 'Activer'}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          on ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Custom fields */}
          <section className="mb-7">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
              Champs personnalisés
            </h3>
            <p className="mb-3 text-xs text-slate-400">
              Ajoutez vos propres champs au formulaire.
            </p>

            {custom.length > 0 && (
              <div className="mb-3 space-y-2">
                {custom.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{f.label}</p>
                      <p className="text-[11px] text-slate-400">Type : {f.type}</p>
                    </div>
                    <button
                      onClick={() => removeCustom(f.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-dashed border-slate-300 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Nom du champ"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#0100ad]"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CustomFieldDef['type'])}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm outline-none focus:border-[#0100ad]"
                >
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                  <option value="time">Heure</option>
                </select>
                <button
                  onClick={addCustom}
                  className="flex items-center justify-center rounded-lg bg-[#0100ad] px-3 text-white transition hover:bg-[#0000c8]"
                  aria-label="Ajouter"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* Connectors */}
          <section className="mb-4">
            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
              <Plug size={14} /> Connecteurs
            </h3>
            <p className="mb-3 text-xs text-slate-400">
              Connectez vos services pour synchroniser et recevoir des rappels.
            </p>
            <div className="space-y-2">
              {CONNECTORS.map((c) => {
                const on = connected.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.color} text-white`}>
                        <Plug size={14} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleConnector(c.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? 'bg-emerald-500 text-white'
                          : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {on ? (
                        <span className="flex items-center gap-1"><Check size={12} /> Connecté</span>
                      ) : (
                        'Connecter'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Les connecteurs sont prêts à être activés — l'architecture est en place pour l'intégration.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            onClick={handleSave}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition ${
              saved ? 'bg-emerald-500' : 'bg-[#0100ad] hover:bg-[#0000c8]'
            }`}
          >
            {saved ? (
              <>
                <Check size={18} /> Enregistré
              </>
            ) : (
              'Enregistrer les paramètres'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
