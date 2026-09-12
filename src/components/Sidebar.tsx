
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, Settings, X, Sparkles } from 'lucide-react';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <div
        className={`
          fixed lg:relative z-50 lg:z-0 top-0 left-0 h-full w-[280px]
          bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">SORAI</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3 mb-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 text-sm font-medium transition-all"
          >
            <Plus size={16} />
            New Chat
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {conversations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/20 text-sm">No conversations yet</p>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeConversationId === conv.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                }`}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
              >
                <MessageSquare size={14} className="shrink-0 opacity-60" />
                <span className="text-sm truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-white/10 transition-all duration-200"
                >
                  <Trash2 size={13} className="text-white/40 hover:text-red-400 transition-colors" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-3 border-t border-white/[0.06]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-white/5 text-white/50 hover:text-white/80 text-sm transition-all duration-200"
          >
            <Settings size={16} />
            Settings
          </motion.button>
        </div>
      </div>
    </>
  );
}
