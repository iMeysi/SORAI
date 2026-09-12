
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { useChat } from './hooks/useChat';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    error,
    apiConfig,
    setActiveConversationId,
    createNewConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
    saveConfig,
  } = useChat();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <ChatArea
          messages={activeConversation?.messages || []}
          isLoading={isLoading}
          error={error}
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={apiConfig}
        onSave={saveConfig}
      />

      <AnimatePresence>
        {!apiConfig.apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm backdrop-blur-xl shadow-lg shadow-violet-500/10"
            >
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Set your API key to start chatting
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

