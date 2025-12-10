import React, { useState } from 'react';
import { DesignResult } from '../types';
import { getEngineeringAdvice } from '../services/geminiService';
import { Bot, Send, Loader2 } from 'lucide-react';

interface Props {
  design: DesignResult;
}

const AiAssistant: React.FC<Props> = ({ design }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const advice = await getEngineeringAdvice(design, query);
    setResponse(advice);
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 text-purple-400">
        <Bot size={20} />
        <h3 className="font-bold">Gemini Engineering Advisor</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-slate-900 rounded p-4 mb-4 border border-slate-700 text-sm">
        {!response && !loading && (
          <p className="text-slate-500 italic">
            Ask me about material selection, lubrication, or manufacturing tolerances for your current design.
          </p>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-purple-400">
            <Loader2 className="animate-spin" size={16} />
            <span>Analyzing design parameters...</span>
          </div>
        )}
        {response && (
          <div className="prose prose-invert prose-sm max-w-none">
             <p className="whitespace-pre-line text-slate-200">{response}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Is nylon suitable for this torque?"
          className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white p-2 rounded transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
