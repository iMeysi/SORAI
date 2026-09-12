
import { useState, useCallback, useRef } from 'react';
import { Message, Conversation, ApiConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: ApiConfig = {
  apiKey: '',
  model: 'qwen-plus',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('sorai-api-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);

  conversationsRef.current = conversations;

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const saveConfig = (config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem('sorai-api-config', JSON.stringify(config));
  };

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    return newConv.id;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(async (content: string) => {
    setError(null);

    if (!apiConfig.apiKey) {
      setError('Please set your API key in settings to start chatting');
      return;
    }

    let convId = activeConversationId;
    let isNewConversation = false;
    if (!convId) {
      convId = createNewConversation();
      isNewConversation = true;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    const currentConv = conversationsRef.current.find(c => c.id === convId);
    const previousMessages = isNewConversation ? [] : (currentConv?.messages || []);

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const title = c.messages.length === 0 ? content.slice(0, 40) + (content.length > 40 ? '...' : '') : c.title;
        return {
          ...c,
          title,
          messages: [...c.messages, userMessage, assistantMessage],
          updatedAt: new Date(),
        };
      }
      return c;
    }));

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const allMessages = [...previousMessages, userMessage];

      const apiMessages = allMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: apiConfig.model,
          messages: apiMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API Error (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
        } catch {
          errorMsg = errorText.slice(0, 200) || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

            const data = trimmedLine.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullContent += delta;

                setConversations(prev => prev.map(c => {
                  if (c.id === convId) {
                    const messages = [...c.messages];
                    const lastMsg = messages[messages.length - 1];
                    if (lastMsg.role === 'assistant') {
                      messages[messages.length - 1] = {
                        ...lastMsg,
                        content: fullContent,
                        isStreaming: true,
                      };
                    }
                    return { ...c, messages };
                  }
                  return c;
                }));
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }
      }

      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          const messages = [...c.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMsg,
              content: fullContent,
              isStreaming: false,
            };
          }
          return { ...c, messages };
        }
        return c;
      }));

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setConversations(prev => prev.map(c => {
          if (c.id === convId) {
            const messages = [...c.messages];
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
              messages[messages.length - 1] = {
                ...lastMsg,
                isStreaming: false,
              };
            }
            return { ...c, messages };
          }
          return c;
        }));
      } else {
        setConversations(prev => prev.map(c => {
          if (c.id === convId) {
            const messages = [...c.messages];
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
              messages[messages.length - 1] = {
                ...lastMsg,
                content: `⚠️ ${err.message}`,
                isStreaming: false,
              };
            }
            return { ...c, messages };
          }
          return c;
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, apiConfig, createNewConversation]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
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
  };
}
