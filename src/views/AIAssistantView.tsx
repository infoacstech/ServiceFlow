import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Send, Bot, User, ArrowRight, MessageSquare, Zap } from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const { currentBusiness, jobs, customers, invoices, inventory } = useApp();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AI Business Copilot for **${currentBusiness.name}**. You can ask me to analyze your daily jobs dispatch, customer balances, low stock inventory alerts, or generate business optimization advice.`,
    },
  ]);

  const presetChips = [
    'How many jobs are pending today?',
    'Which customers have overdue balances?',
    'Give me a summary of total sales and profit.',
    'List all low stock inventory parts.',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q.trim() || loading) return;

    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          context: {
            businessName: currentBusiness.name,
            businessType: currentBusiness.type,
            currency: currentBusiness.currency,
            totalJobsCount: jobs.length,
            pendingJobsCount: jobs.filter((j) => j.status !== 'completed' && j.status !== 'closed').length,
            totalInvoicesCount: invoices.length,
            unpaidInvoicesCount: invoices.filter((i) => i.balanceAmount > 0).length,
            lowStockItemsCount: inventory.filter((i) => i.currentStock <= i.minStock).length,
          },
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Analysis complete.' }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Here is an operational snapshot for ${currentBusiness.name}:\n- Total Active Jobs: ${jobs.length}\n- Pending Unpaid Invoices: ${invoices.filter((i) => i.balanceAmount > 0).length}\n- Low Stock Parts: ${inventory.filter((i) => i.currentStock <= i.minStock).length}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">AI Business Assistant</h1>
            <p className="text-xs text-indigo-200">Powered by Gemini AI • Intelligent analytics for {currentBusiness.name}</p>
          </div>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {presetChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs whitespace-nowrap hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-500" /> {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                You
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse">
            <Bot className="w-4 h-4" /> Gemini AI is analyzing business records...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about your jobs, customers, invoices, or revenue..."
          className="flex-1 px-4 py-2 bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
