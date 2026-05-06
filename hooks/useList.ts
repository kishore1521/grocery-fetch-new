import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useListStore } from '../stores/listStore'
import { GroceryList, GroceryListItem, Product } from '../types'

export function useList() {
  const { session } = useAuthStore()
  const store = useListStore()
  const { activeList, items, setActiveList, setItems, addItem, removeItem, toggleItem } = store
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveList = useCallback(async () => {
    if (!session?.user.id) return
    setLoading(true)
    setError(null)
    try {
      const { data: lists, error: listError } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (listError) throw listError

      let list: GroceryList
      if (lists && lists.length > 0) {
        list = lists[0] as GroceryList
      } else {
        const { data: newList, error: createError } = await supabase
          .from('grocery_lists')
          .insert({ user_id: session.user.id, name: 'My List' })
          .select()
          .single()
        if (createError) throw createError
        list = newList as GroceryList
      }

      setActiveList(list)

      const { data: itemData, error: itemError } = await supabase
        .from('grocery_list_items')
        .select('*, product:products(*)')
        .eq('list_id', list.id)
        .order('id', { ascending: true })

      if (itemError) throw itemError
      setItems((itemData ?? []) as GroceryListItem[])
    } catch (e: unknown) {
      console.error('[useList] fetchActiveList error:', e)
      setError('Failed to load your list.')
    } finally {
      setLoading(false)
    }
  }, [session?.user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateQuantityById = useCallback(async (id: string, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map(i => i.id === id ? { ...i, quantity } : i))
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .update({ quantity })
        .eq('id', id)
      if (error) throw error
    } catch (e: unknown) {
      console.error('[useList] updateQuantity error:', e)
    }
  }, [items, setItems])

  const addProductToList = useCallback(async (product: Product) => {
    if (!activeList) return
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      await updateQuantityById(existing.id, existing.quantity + 1)
      return
    }
    try {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .insert({ list_id: activeList.id, product_id: product.id, quantity: 1 })
        .select('*, product:products(*)')
        .single()
      if (error) throw error
      addItem(data as GroceryListItem)
    } catch (e: unknown) {
      console.error('[useList] addProductToList error:', e)
    }
  }, [activeList, items, updateQuantityById, addItem])

  const addCustomItem = useCallback(async (name: string) => {
    if (!activeList || !name.trim()) return
    try {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .insert({ list_id: activeList.id, custom_item_name: name.trim(), quantity: 1 })
        .select('*, product:products(*)')
        .single()
      if (error) throw error
      addItem(data as GroceryListItem)
    } catch (e: unknown) {
      console.error('[useList] addCustomItem error:', e)
    }
  }, [activeList, addItem])

  const toggleChecked = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    toggleItem(id)
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', id)
      if (error) {
        toggleItem(id) // revert
        throw error
      }
    } catch (e: unknown) {
      console.error('[useList] toggleChecked error:', e)
    }
  }, [items, toggleItem])

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    await updateQuantityById(id, quantity)
  }, [updateQuantityById])

  const deleteItem = useCallback(async (id: string) => {
    removeItem(id)
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (e: unknown) {
      console.error('[useList] deleteItem error:', e)
    }
  }, [removeItem])

  const clearChecked = useCallback(async () => {
    if (!activeList) return
    const checkedIds = items.filter(i => i.is_checked).map(i => i.id)
    if (checkedIds.length === 0) return
    setItems(items.filter(i => !i.is_checked))
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .delete()
        .in('id', checkedIds)
      if (error) throw error
    } catch (e: unknown) {
      console.error('[useList] clearChecked error:', e)
    }
  }, [activeList, items, setItems])

  return {
    activeList,
    items,
    loading,
    error,
    fetchActiveList,
    addProductToList,
    addCustomItem,
    toggleChecked,
    updateQuantity,
    deleteItem,
    clearChecked,
  }
}
