import { FormEvent, useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { supabase, type Task } from '@/lib/supabase';
import { answerQuestion, dailySummary, parseCreateCommand, describeCreatedTasks } from '@/lib/assistant';

type ChatMessage = { role: 'user' | 'assistant'; text: string };

type Props = {
  tasks: Task[];
  onCreated?: () => void;
};

export default function AIAssistant({ tasks, onCreated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [summaryShown, setSummaryShown] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summaryShown || tasks.length === 0) return;
    setSummaryShown(true);
    setMessages([{ role: 'assistant', text: dailySummary(tasks) }]);
  }, [tasks, summaryShown]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: question }]);

    const command = parseCreateCommand(question);
    if (command) {
      setSending(true);
      const rows = command.entries.map((entry) => ({
        title: command.title,
        date: entry.date,
        time: entry.time,
      }));
      const { error } = await supabase.from('tasks').insert(rows);
      setSending(false);
      if (error) {
        setMessages((m) => [...m, { role: 'assistant', text: `Désolé, une erreur est survenue : ${error.message}` }]);
        return;
      }
      setMessages((m) => [...m, { role: 'assistant', text: describeCreatedTasks(command.title, command.entries) }]);
      onCreated?.();
      return;
    }

    const answer = answerQuestion(question, tasks);
    setMessages((m) => [...m, { role: 'assistant', text: answer }]);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#0100ad]/20 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[#0100ad]/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0100ad] shadow-sm">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Assistant</p>
          <p className="text-xs text-slate-500">Résumé, recherche, et création de rendez-vous ("programme-moi...")</p>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Essayez : « programme-moi un voyage le vendredi soir et samedi 15 août ».
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto max-w-[85%] bg-[#0100ad] text-white'
                : 'mr-auto max-w-[90%] bg-slate-100 text-slate-700'
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin" /> Enregistrement…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex : programme-moi un voyage vendredi soir"
          className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#0100ad] focus:shadow-[0_0_0_3px_rgba(1,0,173,.1)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0100ad] text-white transition hover:bg-[#0000c8] disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}