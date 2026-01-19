import { create } from 'zustand'

interface CommandStore {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

export const useCommandStore = create<CommandStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
}))