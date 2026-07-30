import { useMemo, useState } from 'react';
import { Plus, LayoutDashboard, CalendarDays, Sparkles, Menu, X, Settings, Search, Filter, Share2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useSettings } from '@/hooks/useSettings';
import { supabase, type Task } from '@/lib/supabase';
import { CATEGORIES, categorize } from '@/lib/categories';
import Dashboard from '@/components/Dashboard';
import CalendarView from '@/components/CalendarView';
import TaskForm from '@/components/TaskForm';
import SettingsSidebar from '@/components/SettingsSidebar';
import ShareModal from '@/components/ShareModal';

type View = 'dashboard' | 'calendar';

export default function App() {
  const { tasks, loading, error, refresh } = useTasks();
  const { settings, save: saveSettings } = useSettings();
  const [view, setView] = useState<View>('dashboard');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const counts = useMemo(() => {
    const c = { urgent: 0, upcoming: 0, other: 0, done: 0 } as Record<string, number>;
    for (const t of tasks) c[categorize(t)] += 1;
    return c;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.location ?? '').toLowerCase().includes(q) ||
          (t.participants ?? '').toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q),
      );
    }
    if (filterCat !== 'all') {
      list = list.filter((t) => categorize(t) === filterCat);
    }
    return list;
  }, [tasks, search, filterCat]);

  async function toggle(task: Task) {
    const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (error) return;
    refresh();
  }

  async function remove(task: Task) {
    if (!confirm(`Supprimer « ${task.title} » ?`)) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) return;
    refresh();
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(t: Task) {
    setEditing(t);
    setFormOpen(true);
  }
  function jumpCalendar(date: string) {
    setView('calendar');
    setMenuOpen(false);
    // CalendarView defaults to today; a selected date will be applied via prop if needed
    void date;
  }

  const navItems: { key: View; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { key: 'calendar', label: 'Calendrier', icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header (unchanged) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-grad text-white shadow-md shadow-[#0100ad]/30">
              <CalendarDays size={18} />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none tracking-tight text-slate-900">
                Renato<span className="text-[#0100ad]"> Agenda</span>
              </h1>
              <p className="mt-0.5 text-[11px] text-slate-400">Votre journée, organisée.</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#0100ad] text-white shadow-md shadow-[#0100ad]/25' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              aria-label="Partager"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Paramètres"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 rounded-full bg-[#0100ad] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#0100ad]/25 transition hover:bg-[#0000c8]"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-full p-2 text-slate-600 sm:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 px-4 py-2 sm:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    active ? 'bg-[#0100ad]/10 text-[#0100ad]' : 'text-slate-600'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Search + filter bar */}
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une tâche, un lieu, un participant…"
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#0100ad] focus:shadow-[0_0_0_3px_rgba(1,0,173,.1)]"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Filter size={15} className="shrink-0 text-slate-400" />
            {(['all', 'urgent', 'upcoming', 'other', 'done'] as const).map((k) => {
              const cat = k === 'all' ? null : CATEGORIES[k];
              const active = filterCat === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilterCat(k)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active ? 'bg-[#0100ad] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat && <span className={`h-2 w-2 rounded-full ${cat.dot}`} />}
                  {k === 'all' ? 'Tout' : cat!.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['urgent', 'upcoming', 'other', 'done'] as const).map((k) => {
            const cat = CATEGORIES[k];
            return (
              <button
                key={k}
                onClick={() => setFilterCat(filterCat === k ? 'all' : k)}
                className={`rounded-2xl border p-3.5 text-left transition ${cat.ring} ${cat.soft} ${
                  filterCat === k ? 'ring-2 ring-[#0100ad] ring-offset-1' : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${cat.dot}`} />
                  <span className="text-xs font-medium text-slate-500">{cat.label}</span>
                </div>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{counts[k]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0100ad]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">Erreur de chargement : {error}</div>
        ) : view === 'dashboard' ? (
          <Dashboard
            tasks={filteredTasks}
            onToggle={toggle}
            onEdit={openEdit}
            onDelete={remove}
            onJumpCalendar={jumpCalendar}
          />
        ) : (
          <CalendarView tasks={filteredTasks} onToggle={toggle} onEdit={openEdit} onDelete={remove} />
        )}
      </main>

      {/* AI assistant placeholder */}
      <footer className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#0100ad]/30 bg-[#0100ad]/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0100ad] shadow-sm">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Assistant IA — bientôt</p>
            <p className="text-xs text-slate-500">
              Résumés quotidiens et rappels automatiques. Architecture prête à accueillir cette fonctionnalité.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating add button (mobile) */}
      <button
        onClick={openNew}
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#0100ad] text-white shadow-xl shadow-[#0100ad]/40 transition hover:bg-[#0000c8] sm:hidden"
        aria-label="Ajouter une tâche"
      >
        <Plus size={24} />
      </button>

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
        editing={editing}
        enabledFields={settings.enabledFields}
        customFields={settings.customFields}
      />

      <SettingsSidebar
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        tasks={tasks}
      />
    </div>
  );
}
