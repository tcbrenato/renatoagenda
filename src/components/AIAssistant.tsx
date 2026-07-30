import { FormEvent, useEffect, useRef, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { answerQuestion, dailySummary } from '@/lib/assistant';

type ChatMessage = { role: 'user' | 'assistant'; text: string };

export default function AIAssistant({ tasks }: { tasks: Task[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [summaryShown, setSummaryShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summaryShown || tasks.length === 0) return;
    setSummaryShown(true);
    setMessages([{ role: 'assistant', text: dailySummary(tasks) }]);
  }, [tasks, summaryShown]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput('');
    const answer = answerQuestion(question, tasks);
    setMessages((m) => [...m, { role: 'user', text: question }, { role: 'assistant', text: answer }]);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#0100ad]/20 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[#0100ad]/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0100ad] shadow-sm">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Assistant</p>
          <p className="text-xs text-slate-500">Résumé du jour et recherche dans vos programmes</p>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-80 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Ajoutez une tâche pour voir apparaître votre résumé du jour.</p>
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
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex : qu'est-ce que j'ai le 15 août ?"
          className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#0100ad] focus:shadow-[0_0_0_3px_rgba(1,0,173,.1)]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0100ad] text-white transition hover:bg-[#0000c8] disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
