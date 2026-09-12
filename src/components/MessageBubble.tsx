
import { motion } from 'framer-motion';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import { Message } from '../types';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
  index: number;
}

function formatContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3);
      const lines = code.split('\n');
      const lang = lines[0]?.match(/^\w+$/) ? lines[0] : '';
      const codeContent = lang ? lines.slice(1).join('\n') : code;
      return (
        <div key={i} className="my-3 rounded-xl overflow-hidden border border-white/10">
          {lang && (
            <div className="px-4 py-1.5 bg-white/5 text-xs text-white/40 border-b border-white/10 font-mono">
              {lang}
            </div>
          )}
          <pre className="p-4 bg-[#1a1a2e] overflow-x-auto">
            <code className="text-sm text-emerald-300/90 font-mono leading-relaxed">{codeContent.trim()}</code>
          </pre>
        </div>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-white/10 text-violet-300 text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic text-white/80">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
        className="w-1 h-1 rounded-full bg-violet-400"
      />
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
        className="w-1 h-1 rounded-full bg-violet-400"
      />
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
        className="w-1 h-1 rounded-full bg-violet-400"
      />
    </span>
  );
}

export default function MessageBubble({ message, index }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.03, 0.3),
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="group flex gap-4 px-4 py-5"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, delay: Math.min(index * 0.03, 0.3) + 0.1 }}
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600'
        }`}
      >
        {isUser ? (
          <User size={15} className="text-white" />
        ) : (
          <Sparkles size={15} className="text-white" />
        )}
      </motion.div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/80">
            {isUser ? 'You' : 'SORAI'}
          </span>
          <span className="text-xs text-white/30">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`text-[15px] ${isUser ? 'text-white/90' : 'text-white/80'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : message.content ? (
            <div className="prose prose-invert max-w-none leading-relaxed">
              {formatContent(message.content)}
              {message.isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                  className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 py-1">
              <StreamingIndicator />
            </div>
          )}
        </div>

        {!isUser && !message.isStreaming && message.content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 text-xs transition-all duration-200"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
