
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Server, Cpu } from 'lucide-react';
import { ApiConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
}

export default function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<ApiConfig>(config);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  const handleSave = () => {
    onSave({
      ...localConfig,
      apiKey: localConfig.apiKey.trim(),
      baseUrl: localConfig.baseUrl.trim() || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <Key size={14} className="text-violet-400" />
                    API Key
                  </label>
                  <input
                    type="password"
                    value={localConfig.apiKey}
                    onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-white/90 placeholder-white/20 outline-none focus:border-violet-500/40 transition-all duration-200 text-sm font-mono"
                  />
                  <p className="text-xs text-white/30">
                    Get your API key from{' '}
                    <a
                      href="https://dashscope.console.aliyun.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400/70 hover:text-violet-400 underline underline-offset-2"
                    >
                      Alibaba Cloud DashScope
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <Server size={14} className="text-violet-400" />
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={localConfig.baseUrl}
                    onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                    placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-white/90 placeholder-white/20 outline-none focus:border-violet-500/40 transition-all duration-200 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <Cpu size={14} className="text-violet-400" />
                    Model
                  </label>
                  <select
                    value={localConfig.model}
                    onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-white/90 outline-none focus:border-violet-500/40 transition-all duration-200 text-sm cursor-pointer"
                  >
                    <option value="qwen-plus" className="bg-[#141414]">Qwen Plus (Recommended)</option>
                    <option value="qwen-turbo" className="bg-[#141414]">Qwen Turbo (Fast)</option>
                    <option value="qwen-max" className="bg-[#141414]">Qwen Max (Best Quality)</option>
                    <option value="qwen-long" className="bg-[#141414]">Qwen Long (Long Context)</option>
                    <option value="qwen2.5-72b-instruct" className="bg-[#141414]">Qwen 2.5 72B</option>
                    <option value="qwen2.5-32b-instruct" className="bg-[#141414]">Qwen 2.5 32B</option>
                    <option value="qwen2.5-14b-instruct" className="bg-[#141414]">Qwen 2.5 14B</option>
                    <option value="qwen2.5-7b-instruct" className="bg-[#141414]">Qwen 2.5 7B</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.06]">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-violet-500/20 transition-all duration-200"
                >
                  Save Changes
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
