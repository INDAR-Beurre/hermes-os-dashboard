import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectionConfig } from '../api/hermes';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool_progress';
  content: string;
  timestamp: number;
  toolCallId?: string;
  toolName?: string;
  status?: string;
}

export interface CronJob {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  status: 'active' | 'paused';
  deliver: string;
  created_at: number;
  last_run_at?: number;
  next_run_at?: number;
}

export interface MemoryEntry {
  target: string;
  content: string;
  source?: string;
}

export interface Skill {
  name: string;
  description: string;
  enabled: boolean;
}

export interface Session {
  id: string;
  title: string;
  model: string;
  source: string;
  messageCount: number;
  isActive: boolean;
  preview: string;
  startedAt: number;
  endedAt?: number;
}

interface AppState {
  // Connection
  connection: ConnectionConfig | null;
  setConnection: (c: ConnectionConfig | null) => void;

  // Sessions
  sessions: Session[];
  setSessions: (s: Session[]) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;

  // Chat
  messages: Message[];
  setMessages: (m: Message[]) => void;
  appendMessage: (m: Message) => void;
  updateLastMessage: (content: string) => void;
  upsertToolProgress: (progress: Message) => void;
  isStreaming: boolean;
  setStreaming: (v: boolean) => void;
  clearChat: () => void;

  // Cron
  cronJobs: CronJob[];
  setCronJobs: (j: CronJob[]) => void;
  upsertCronJob: (j: CronJob) => void;
  removeCronJob: (id: string) => void;

  // Memory
  memory: MemoryEntry[];
  setMemory: (m: MemoryEntry[]) => void;

  // Skills
  skills: Skill[];
  setSkills: (s: Skill[]) => void;

  // Model info
  modelInfo: { provider: string; model: string } | null;
  setModelInfo: (m: { provider: string; model: string } | null) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Connection
      connection: null,
      setConnection: (c) => set({ connection: c }),

      // Sessions
      sessions: [],
      setSessions: (s) => set({ sessions: s }),
      currentSessionId: null,
      setCurrentSessionId: (id) => set({ currentSessionId: id }),

      // Chat
      messages: [],
      setMessages: (m) => set({ messages: m }),
      appendMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      updateLastMessage: (content) =>
        set((s) => {
          const msgs = [...s.messages];
          if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          return { messages: msgs };
        }),
      upsertToolProgress: (progress) =>
        set((s) => {
          const msgs = [...s.messages];
          const idx = msgs.findIndex(
            (m) => m.role === 'tool_progress' && m.toolCallId === progress.toolCallId,
          );
          if (idx >= 0) msgs[idx] = progress;
          else msgs.push(progress);
          return { messages: msgs };
        }),
      isStreaming: false,
      setStreaming: (v) => set({ isStreaming: v }),
      clearChat: () => set({ messages: [] }),

      // Cron
      cronJobs: [],
      setCronJobs: (j) => set({ cronJobs: j }),
      upsertCronJob: (j) =>
        set((s) => {
          const idx = s.cronJobs.findIndex((c) => c.id === j.id);
          if (idx >= 0) {
            const updated = [...s.cronJobs];
            updated[idx] = j;
            return { cronJobs: updated };
          }
          return { cronJobs: [...s.cronJobs, j] };
        }),
      removeCronJob: (id) =>
        set((s) => ({ cronJobs: s.cronJobs.filter((c) => c.id !== id) })),

      // Memory
      memory: [],
      setMemory: (m) => set({ memory: m }),

      // Skills
      skills: [],
      setSkills: (s) => set({ skills: s }),

      // Model info
      modelInfo: null,
      setModelInfo: (m) => set({ modelInfo: m }),

      // UI
      sidebarOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      loading: false,
      setLoading: (v) => set({ loading: v }),
      error: null,
      setError: (e) => set({ error: e }),
    }),
    {
      name: 'hermes-os-storage',
      partialize: (state) => ({
        connection: state.connection,
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);
