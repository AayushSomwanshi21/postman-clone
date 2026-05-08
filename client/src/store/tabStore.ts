import { create } from 'zustand';
import type { Response } from '@/lib/types';

export interface Tab {
  id: string;
  name: string;
  method: string;
  response: Response | null;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string;
  openTab: (tab: Omit<Tab, 'response'>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (data: Partial<Pick<Tab, 'name' | 'method'>>) => void;
  saveTabResponse: (id: string, response: Response | null) => void;
}

const initialId = crypto.randomUUID();

export const useTabStore = create<TabState>((set) => ({
  tabs: [{ id: initialId, name: 'New Request', method: 'GET', response: null }],
  activeTabId: initialId,

  openTab: (tab) => set((s) => {
    const exists = s.tabs.some((t) => t.id === tab.id);
    return {
      tabs: exists ? s.tabs : [...s.tabs, { ...tab, response: null }],
      activeTabId: tab.id,
    };
  }),

  closeTab: (id) => set((s) => {
    const tabs = s.tabs.filter((t) => t.id !== id);
    if (tabs.length === 0) {
      const newId = crypto.randomUUID();
      return { tabs: [{ id: newId, name: 'New Request', method: 'GET', response: null }], activeTabId: newId };
    }
    const activeTabId = s.activeTabId === id
      ? tabs[Math.max(0, s.tabs.findIndex((t) => t.id === id) - 1)].id
      : s.activeTabId;
    return { tabs, activeTabId };
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateActiveTab: (data) => set((s) => ({
    tabs: s.tabs.map((t) => t.id === s.activeTabId ? { ...t, ...data } : t),
  })),

  saveTabResponse: (id, response) => set((s) => ({
    tabs: s.tabs.map((t) => t.id === id ? { ...t, response } : t),
  })),
}));
