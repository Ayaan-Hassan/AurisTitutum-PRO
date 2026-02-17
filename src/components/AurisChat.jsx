import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
// API key: set in .env as VITE_OPENAI_API_KEY (get one at https://platform.openai.com/api-keys)
const DEFAULT_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const getSystemPrompt = (habits) => {
  const base = `You are Auris, a friendly and knowledgeable AI assistant inside AurisTitutum, a habit-tracking app. You help users with their habits, goals, consistency, and motivation. Be conversational, supportive, and concise.`;
  if (!habits?.length) return base;
  const names = habits.map(h => h.name).join(', ');
  const totalLogs = habits.reduce((a, b) => a + (b.totalLogs || 0), 0);
  return `${base} The user currently has ${habits.length} habit(s): ${names}. Total logs across all habits: ${totalLogs}. You can reference these when giving advice.`;
};

export default function AurisChat({ isOpen, onClose, habits }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Auris. Ask me anything about your habits, goals, or how to stay consistent. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const key = DEFAULT_API_KEY;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!key) {
      setError('OpenAI API key not set. Add VITE_OPENAI_API_KEY to .env (see README).');
      return;
    }
    setError(null);
    setInput('');
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: getSystemPrompt(habits) },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            userMsg
          ]
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || res.statusText || 'Request failed');
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e.message || '';
      const isQuota = /quota|billing|exceeded|usage limit/i.test(msg);
      const friendly = isQuota
        ? "You've exceeded your OpenAI usage quota. Please check your plan and billing at platform.openai.com."
        : `Sorry, something went wrong: ${msg}`;
      setMessages(prev => [...prev, { role: 'assistant', content: friendly }]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bg-main border-l border-border-color shadow-xl z-50 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-4 border-b border-border-color shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Icon name="brain" size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Auris</h2>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">AI assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg border border-border-color flex items-center justify-center text-text-secondary hover:text-text-primary">
            <Icon name="x" size={16} />
          </button>
        </div>

        {!key && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
            Set VITE_OPENAI_API_KEY in .env to use Auris. Get a key at platform.openai.com/api-keys
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-accent text-bg-main' : 'bg-accent-dim border border-border-color text-text-primary'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5 bg-accent-dim border border-border-color text-text-secondary text-sm">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-border-color shrink-0">
          {error && <p className="text-danger text-[10px] mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Message Auris..."
              className="flex-1 rounded-xl border border-border-color bg-bg-main px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-accent"
            />
            <button onClick={send} disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-xl bg-accent text-bg-main text-sm font-bold disabled:opacity-50">Send</button>
          </div>
        </div>
      </div>
    </>
  );
}
