import { useListStore } from '../stores/listStore'

export function useList() {
  return useListStore()
}
