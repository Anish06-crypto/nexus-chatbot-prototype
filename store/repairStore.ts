import { create } from "zustand";
import { ParsedResponse } from "../lib/intentParser";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type RepairStore = {
  messages: Message[];
  lastIntent: ParsedResponse | null;
  addMessage: (message: Message) => void;
  setLastIntent: (intent: ParsedResponse | null) => void;
  clearIntent: () => void;
};

export const useRepairStore = create<RepairStore>((set) => ({
  messages: [],
  lastIntent: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLastIntent: (intent) => set({ lastIntent: intent }),
  clearIntent: () => set({ lastIntent: null }),
}));

