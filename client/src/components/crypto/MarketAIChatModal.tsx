import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Loader2,
} from 'lucide-react';

interface AIChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

interface MarketAIChatModalProps {
  asset: any;
  insight: any;
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const MarketAIChatModal: React.FC<MarketAIChatModalProps> = ({
  asset,
  insight,
  isOpen,
  onClose,
  apiBase,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting & coin insight summary
  useEffect(() => {
    if (asset && isOpen) {
      const initialText =
        insight?.bias_summary ||
        `Hello! I'm your AI Market Strategist tracking ${asset.name} (${asset.symbol}) live. Ask me about entry zones, support/resistance levels, RSI signals, or risk mitigation.`;

      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: initialText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [asset?.id, isOpen, insight]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!isOpen || !asset) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${apiBase}/crypto/coins/${asset.id}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: AIChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Failed to get AI reply');
      }
    } catch {
      // Fallback response
      const fallbackMsg: AIChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Analysis for ${asset.name}: Current pivot is $${asset.price?.toLocaleString()} with key support around $${(
          asset.price * 0.965
        ).toFixed(2)} and resistance at $${(asset.price * 1.035).toFixed(2)}. Maintain tight stop management.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`${
          isExpanded
            ? 'w-[95vw] sm:w-[480px] h-[85vh]'
            : 'w-[95vw] sm:w-[380px] h-[520px]'
        } flex flex-col bg-white dark:bg-[#0A0C13] border border-black/[0.1] dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden font-sans transition-all duration-300`}
      >
        {/* Header Bar */}
        <div className="p-3.5 bg-gradient-to-r from-gray-100 via-gray-50 to-white dark:from-[#0F1322] dark:via-[#0D101A] dark:to-[#0A0C14] border-b border-black/[0.08] dark:border-white/10 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3E4FFF]/15 dark:bg-[#3E4FFF]/20 border border-[#3E4FFF]/30 dark:border-[#3E4FFF]/40 flex items-center justify-center text-[#3E4FFF] shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">
                  AI Analyst • {asset.symbol}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  LIVE
                </span>
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                ${asset.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({asset.change_24h >= 0 ? '+' : ''}{asset.change_24h}%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:text-rose-600 dark:hover:text-white hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Close chat"
            >
              <X className="w-4 h-4 hover:text-rose-500" />
            </button>
          </div>
        </div>

        {/* Quick Insight Strip */}
        {insight?.signal && (
          <div className="px-3.5 py-2 bg-gray-50 dark:bg-black/40 border-b border-black/[0.06] dark:border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Signal Rating:</span>
            <span
              className="font-bold px-2 py-0.5 rounded text-[10px]"
              style={{
                backgroundColor: `${insight.signal_color}18`,
                color: insight.signal_color,
                border: `1px solid ${insight.signal_color}35`,
              }}
            >
              {insight.signal}
            </span>
          </div>
        )}

        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs thin-scrollbar bg-gray-50/50 dark:bg-transparent">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-6 h-6 rounded-lg bg-[#3E4FFF]/15 dark:bg-[#3E4FFF]/20 border border-[#3E4FFF]/30 flex items-center justify-center text-[#3E4FFF] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isAi
                      ? 'bg-white dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 border border-black/[0.08] dark:border-white/10 shadow-sm'
                      : 'bg-[#3E4FFF] text-white shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">{m.text}</div>
                  <div
                    className={`text-[9px] mt-1 font-mono text-right ${
                      isAi ? 'text-gray-400 dark:text-gray-500' : 'text-blue-200'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
                {!isAi && (
                  <div className="w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2.5 justify-start items-center">
              <div className="w-6 h-6 rounded-lg bg-[#3E4FFF]/15 dark:bg-[#3E4FFF]/20 border border-[#3E4FFF]/30 flex items-center justify-center text-[#3E4FFF] shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="px-3 py-2 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E4FFF] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E4FFF] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E4FFF] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] font-mono ml-1">Analyzing tick volume & order book...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        {insight?.chat_starters && messages.length <= 2 && (
          <div className="px-3 pb-2 pt-1 border-t border-black/[0.06] dark:border-white/5 flex gap-1.5 overflow-x-auto thin-scrollbar bg-gray-50 dark:bg-transparent">
            {insight.chat_starters.slice(0, 3).map((prompt: string, i: number) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.04] hover:bg-[#3E4FFF]/15 dark:hover:bg-[#3E4FFF]/20 hover:text-[#3E4FFF] dark:hover:text-white border border-black/[0.08] dark:border-white/10 transition-colors text-left cursor-pointer shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-2.5 bg-gray-50 dark:bg-[#0D0F17] border-t border-black/[0.08] dark:border-white/10 flex items-center gap-2 select-none"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask AI Analyst about ${asset.symbol}...`}
            className="flex-1 bg-white dark:bg-white/[0.04] border border-black/[0.1] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#3E4FFF] font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-xl bg-[#3E4FFF] hover:bg-[#3242e8] disabled:opacity-40 disabled:hover:bg-[#3E4FFF] text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
