
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Menu, Sparkles } from 'lucide-react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  onToggleSidebar: () => void;
}

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const suggestions = [
    { icon: '💡', text: 'Explain quantum computing in simple terms' },
    { icon: '🎨', text: 'Help me write a creative short story' },
    { icon: '🔧', text: 'Debug my Python code' },
    { icon: '📊', text: 'Analyze data and find trends' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center h-full px-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles size={28} className="text-white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-white mb-2 tracking-tight"
      >
        How can I help you today?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white/40 text-center mb-10 max-w-md"
      >
        I'm SORAI, your AI assistant powered by Qwen. Ask me anything!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full"
      >
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.08] hover:border-white/15 text-left transition-all duration-200"
          >
            <span className="text-xl">{suggestion.icon}</span>
            <span className="text-sm text-white/60">{suggestion.text}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function ChatArea({
  messages,
  isLoading,
  error,
  onSendMessage,
  onStopGeneration,
  onToggleSidebar,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white/80 transition-all lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-medium text-white/70">SORAI</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400/80">Online</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={onSendMessage} />
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} index={i} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 bg-red-500/10 border-t border-red-500/20"
          >
            <p className="text-center text-sm text-red-400/80">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky bottom-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end bg-[#1a1a1a] border border-white/[0.08] rounded-2xl focus-within:border-violet-500/40 focus-within:shadow-lg focus-within:shadow-violet-500/5 transition-all duration-300">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message SORAI..."
                rows={1}
                className="flex-1 bg-transparent text-white/90 placeholder-white/30 px-5 py-4 resize-none outline-none text-[15px] max-h-[200px]"
              />

              <div className="flex items-center gap-1 p-2">
                {isLoading ? (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={onStopGeneration}
                    className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
                  >
                    <Square size={16} fill="currentColor" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit"
                    disabled={!input.trim()}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      input.trim()
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <Send size={16} />
                  </motion.button>
                )}
              </div>
            </div>
          </form>

          <p className="text-center text-xs text-white/20 mt-3">
            SORAI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
