import { create } from 'zustand'
import { Price } from '../types'

interface PriceState {
  prices: Price[]
  setPrices: (prices: Price[]) => void
  clearPrices: () => void
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: [],
  setPrices: (prices) => set({ prices }),
  clearPrices: () => set({ prices: [] }),
}))
