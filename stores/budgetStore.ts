import { create } from 'zustand'
import { Budget } from '../types'

interface BudgetState {
  budget: Budget | null
  setBudget: (budget: Budget | null) => void
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budget: null,
  setBudget: (budget) => set({ budget }),
}))
