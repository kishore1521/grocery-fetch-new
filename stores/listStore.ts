import { create } from 'zustand'
import { GroceryList, GroceryListItem } from '../types'

interface ListState {
  activeList: GroceryList | null
  items: GroceryListItem[]
  setActiveList: (list: GroceryList | null) => void
  setItems: (items: GroceryListItem[]) => void
  addItem: (item: GroceryListItem) => void
  removeItem: (id: string) => void
  toggleItem: (id: string) => void
  clearList: () => void
}

export const useListStore = create<ListState>((set) => ({
  activeList: null,
  items: [],
  setActiveList: (activeList) => set({ activeList }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  toggleItem: (id) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, is_checked: !i.is_checked } : i)
  })),
  clearList: () => set({ items: [] }),
}))
