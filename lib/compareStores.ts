import { supabase } from './supabase'
import { GroceryListItem } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoreItemResult {
  product_id: string
  name: string
  price: number
  loyalty_price: number | null
  quantity: number
}

export interface StoreResult {
  store_id: string
  store_name: string
  store_chain: string
  total: number
  covered_count: number
  total_count: number
  is_complete: boolean
  missing_names: string[]
  items: StoreItemResult[]
}

export interface TripSplitStore {
  store_chain: string
  store_name: string
  items: { product_id: string; name: string; price: number; quantity: number }[]
  subtotal: number
}

export interface TripSplitResult {
  stores: TripSplitStore[]
  grand_total: number
  savings: number // vs cheapest complete single store
}

export interface CompareResult {
  single_store: StoreResult[]
  trip_split: TripSplitResult | null
  skipped_names: string[]    // custom items excluded
  priced_count: number       // unchecked items with product_id
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function compareStores(items: GroceryListItem[]): Promise<CompareResult> {
  const unchecked = items.filter(i => !i.is_checked)
  const withProduct = unchecked.filter(i => i.product_id != null)
  const custom = unchecked.filter(i => i.product_id == null)
  const skipped_names = custom.map(i => i.custom_item_name ?? 'item')

  if (withProduct.length < 3) {
    return { single_store: [], trip_split: null, skipped_names, priced_count: withProduct.length }
  }

  const productIds = withProduct.map(i => i.product_id!)

  // Build name lookup
  const nameMap: Record<string, string> = {}
  const qtyMap: Record<string, number> = {}
  for (const item of withProduct) {
    nameMap[item.product_id!] = item.product?.name ?? item.custom_item_name ?? 'Item'
    qtyMap[item.product_id!] = item.quantity
  }

  // Fetch all prices for these products
  const { data, error } = await supabase
    .from('prices')
    .select(`
      product_id,
      store_id,
      regular_price,
      loyalty_price,
      price_per_unit,
      in_stock,
      stores ( id, name, chain, has_loyalty, loyalty_name )
    `)
    .in('product_id', productIds)
    .eq('in_stock', true)

  if (error || !data) {
    return { single_store: [], trip_split: null, skipped_names, priced_count: withProduct.length }
  }

  // Parse rows
  type PriceRow = {
    product_id: string
    store_id: string
    regular_price: number
    loyalty_price: number | null
    price_per_unit: number | null
    stores: { id: string; name: string; chain: string; has_loyalty: boolean; loyalty_name: string | null } | null
  }

  const rows = (data as unknown as PriceRow[]).filter(r => r.stores != null)

  // ── Single-store results ──────────────────────────────────────────────────

  // Group rows by store_id
  const byStore: Record<string, PriceRow[]> = {}
  for (const row of rows) {
    if (!byStore[row.store_id]) byStore[row.store_id] = []
    byStore[row.store_id].push(row)
  }

  const single_store: StoreResult[] = []

  for (const [storeId, storeRows] of Object.entries(byStore)) {
    const storeInfo = storeRows[0].stores!
    const coveredIds = new Set(storeRows.map(r => r.product_id))

    const missing_names: string[] = []
    for (const pid of productIds) {
      if (!coveredIds.has(pid)) missing_names.push(nameMap[pid])
    }

    const items: StoreItemResult[] = []
    let total = 0

    for (const pid of productIds) {
      const row = storeRows.find(r => r.product_id === pid)
      if (!row) continue
      const effective = Number(row.price_per_unit ?? row.loyalty_price ?? row.regular_price)
      const qty = qtyMap[pid]
      total += effective * qty
      items.push({
        product_id: pid,
        name: nameMap[pid],
        price: effective,
        loyalty_price: row.loyalty_price ? Number(row.loyalty_price) : null,
        quantity: qty,
      })
    }

    single_store.push({
      store_id: storeId,
      store_name: storeInfo.name,
      store_chain: storeInfo.chain,
      total,
      covered_count: coveredIds.size,
      total_count: productIds.length,
      is_complete: missing_names.length === 0,
      missing_names,
      items,
    })
  }

  // Sort: complete stores first, then by total ascending
  single_store.sort((a, b) => {
    if (a.is_complete !== b.is_complete) return a.is_complete ? -1 : 1
    return a.total - b.total
  })

  // ── Trip Split ────────────────────────────────────────────────────────────

  // For each product, find cheapest price across all stores
  const splitByStore: Record<string, TripSplitStore> = {}

  for (const pid of productIds) {
    const options = rows.filter(r => r.product_id === pid)
    if (options.length === 0) continue

    const cheapest = options.reduce<PriceRow>((min, r) => {
      const ep = Number(r.price_per_unit ?? r.loyalty_price ?? r.regular_price)
      const minEp = Number(min.price_per_unit ?? min.loyalty_price ?? min.regular_price)
      return ep < minEp ? r : min
    }, options[0])

    const chain = cheapest.stores!.chain
    const effective = Number(cheapest.price_per_unit ?? cheapest.loyalty_price ?? cheapest.regular_price)
    const qty = qtyMap[pid]

    if (!splitByStore[chain]) {
      splitByStore[chain] = {
        store_chain: chain,
        store_name: cheapest.stores!.name,
        items: [],
        subtotal: 0,
      }
    }
    splitByStore[chain].items.push({ product_id: pid, name: nameMap[pid], price: effective, quantity: qty })
    splitByStore[chain].subtotal += effective * qty
  }

  const splitStores = Object.values(splitByStore).sort((a, b) => b.subtotal - a.subtotal)
  const grand_total = splitStores.reduce((s, st) => s + st.subtotal, 0)

  const cheapestComplete = single_store.find(s => s.is_complete)
  const cheapestSingle = cheapestComplete?.total ?? single_store[0]?.total ?? Infinity
  const savings = cheapestSingle - grand_total

  const trip_split: TripSplitResult | null =
    savings >= 1 && splitStores.length >= 2
      ? { stores: splitStores, grand_total, savings }
      : null

  return { single_store, trip_split, skipped_names, priced_count: withProduct.length }
}
