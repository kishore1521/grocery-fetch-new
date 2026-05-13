import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useListStore } from '../stores/listStore'
import { GroceryList, GroceryListItem, Product } from '../types'

export function useList() {
  const { session, isGuest } = useAuthStore()
  const store = useListStore()
  const { activeList, items, setActiveList, setItems, addItem, removeItem, toggleItem } = store
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Fetch / create active list ───────────────────────────────────────────

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

  // ─── Quantity (internal) ──────────────────────────────────────────────────

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
      console.error('[useList] updateQuantityById error:', e)
    }
  }, [items, setItems])

  // ─── Legacy: add by Product object (kept for compatibility) ───────────────

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

  // ─── Legacy: add custom by name only (kept for compatibility) ─────────────

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

  // ─── New: add by product ID (with quantity + unit) ────────────────────────

  const addProductToListById = useCallback(async (
    productId: string,
    quantity = 1,
    unit?: string,
    priceAtAdd?: number,
  ) => {
    const existing = items.find(i => i.product_id === productId)
    if (existing) {
      await updateQuantityById(existing.id, existing.quantity + quantity)
      return
    }

    if (isGuest) {
      const guestItem: GroceryListItem = {
        id: Date.now().toString(),
        list_id: 'guest',
        product_id: productId,
        custom_item_name: null,
        quantity,
        unit: unit ?? null,
        notes: null,
        is_checked: false,
        price_at_add: priceAtAdd ?? null,
      }
      addItem(guestItem)
      return
    }

    if (!activeList) return
    try {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .insert({
          list_id: activeList.id,
          product_id: productId,
          quantity,
          unit: unit ?? null,
          price_at_add: priceAtAdd ?? null,
        })
        .select(`
          *,
          product:products (
            id, name, brand, category, unit,
            image_url, concept, variant_type, size_label
          )
        `)
        .single()
      if (error) throw error
      addItem(data as GroceryListItem)
    } catch (e: unknown) {
      console.error('[useList] addProductToListById error:', e)
    }
  }, [activeList, isGuest, items, updateQuantityById, addItem])

  // ─── New: add custom item with full fields ────────────────────────────────

  const addCustomItemFull = useCallback(async (
    name: string,
    quantity = 1,
    unit = 'each',
    notes?: string,
  ) => {
    if (!name.trim()) return

    if (isGuest) {
      const guestItem: GroceryListItem = {
        id: Date.now().toString(),
        list_id: 'guest',
        product_id: null,
        custom_item_name: name.trim(),
        quantity,
        unit,
        notes: notes ?? null,
        is_checked: false,
        price_at_add: null,
      }
      addItem(guestItem)
      return
    }

    if (!activeList) return
    try {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .insert({
          list_id: activeList.id,
          custom_item_name: name.trim(),
          quantity,
          unit,
          notes: notes ?? null,
        })
        .select('*')
        .single()
      if (error) throw error
      addItem(data as GroceryListItem)
    } catch (e: unknown) {
      console.error('[useList] addCustomItemFull error:', e)
    }
  }, [activeList, isGuest, addItem])

  // ─── New: submit price tracking request ──────────────────────────────────

  const submitPriceRequest = useCallback(async (
    productName: string,
    brandHint?: string,
    storeHints?: string[],
    notes?: string,
  ) => {
    try {
      await supabase.from('price_requests').insert({
        user_id: session?.user.id ?? null,
        product_name: productName,
        store_name: storeHints?.join(', ') ?? null,
        notes: [brandHint ? `Brand: ${brandHint}` : null, notes ?? null]
          .filter(Boolean)
          .join(' | ') || null,
        status: 'pending',
      })
    } catch (e: unknown) {
      console.error('[useList] submitPriceRequest error:', e)
    }
  }, [session?.user.id])

  // ─── Toggle checked ───────────────────────────────────────────────────────

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

  // ─── Update quantity (exported) ───────────────────────────────────────────

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    await updateQuantityById(id, quantity)
  }, [updateQuantityById])

  // ─── Update item fields (qty, unit, notes) ───────────────────────────────

  const updateItem = useCallback(async (
    id: string,
    fields: { quantity?: number; unit?: string | null; notes?: string | null },
  ) => {
    setItems(items.map(i => i.id === id ? { ...i, ...fields } : i))
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .update(fields)
        .eq('id', id)
      if (error) throw error
    } catch (e: unknown) {
      console.error('[useList] updateItem error:', e)
    }
  }, [items, setItems])

  // ─── Delete item ──────────────────────────────────────────────────────────

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

  // ─── Clear checked items ──────────────────────────────────────────────────

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
    // legacy
    addProductToList,
    addCustomItem,
    // new
    addProductToListById,
    addCustomItemFull,
    submitPriceRequest,
    // shared
    toggleChecked,
    updateQuantity,
    updateItem,
    deleteItem,
    clearChecked,
  }
}
