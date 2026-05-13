import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoreOption {
  product_id: string
  product_name: string
  brand: string | null
  store_brand_name: string | null
  store_id: string
  store_name: string
  store_chain: string
  regular_price: number
  loyalty_price: number | null
  price_per_unit: number | null
  effective_price: number
  has_loyalty: boolean
  loyalty_name: string | null
  is_best: boolean
  image_url: string | null
  variant_type: string
  size_label: string
}

export interface SizeGroup {
  key: string
  size_label: string
  variant_type: string
  store_options: StoreOption[]
  best_price: number
  best_store_chain: string
}

export interface ConceptGroup {
  concept: string
  display_name: string
  sizes: SizeGroup[]
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchProductsByConcept(
  query: string
): Promise<ConceptGroup[]> {
  if (query.trim().length < 2) return []

  const q = query.trim().toLowerCase()

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, brand, category, unit,
      concept, variant_type, size_label,
      sort_order, is_store_brand, image_url,
      prices (
        store_id,
        regular_price,
        loyalty_price,
        price_per_unit,
        store_brand_name,
        stores (
          id, name, chain,
          has_loyalty, loyalty_name
        )
      )
    `)
    .or(
      `concept.ilike.%${q}%,` +
      `name.ilike.%${q}%,` +
      `variant_type.ilike.%${q}%,` +
      `brand.ilike.%${q}%,` +
      `category.ilike.%${q}%`
    )
    .order('sort_order', { ascending: true })
    .limit(60)

  if (error || !data) return []

  // Build flat list of all store options across all products
  const allOptions: (StoreOption & {
    concept: string
    variant_type: string
    size_label: string
    sort_order: number
  })[] = []

  for (const product of data as unknown[]) {
    const p = product as {
      id: string
      name: string
      brand: string | null
      category: string
      unit: string | null
      concept: string | null
      variant_type: string | null
      size_label: string | null
      sort_order: number | null
      is_store_brand: boolean
      image_url: string | null
      prices: {
        store_id: string
        regular_price: number
        loyalty_price: number | null
        price_per_unit: number | null
        store_brand_name: string | null
        stores: {
          id: string
          name: string
          chain: string
          has_loyalty: boolean
          loyalty_name: string | null
        } | null
      }[]
    }

    const prices = p.prices || []
    for (const price of prices) {
      if (!price.stores) continue
      const effectivePrice =
        price.price_per_unit ??
        price.loyalty_price ??
        price.regular_price

      allOptions.push({
        product_id: p.id,
        product_name: p.name,
        brand: p.brand,
        store_brand_name: price.store_brand_name,
        store_id: price.store_id,
        store_name: price.stores.name,
        store_chain: price.stores.chain,
        regular_price: Number(price.regular_price),
        loyalty_price: price.loyalty_price ? Number(price.loyalty_price) : null,
        price_per_unit: price.price_per_unit ? Number(price.price_per_unit) : null,
        effective_price: Number(effectivePrice),
        has_loyalty: price.stores.has_loyalty,
        loyalty_name: price.stores.loyalty_name,
        is_best: false,
        image_url: p.image_url,
        concept: p.concept || 'other',
        variant_type: p.variant_type || p.name,
        size_label: p.size_label || p.unit || '',
        sort_order: p.sort_order || 0,
      })
    }
  }

  // Group by concept → variant_type + size_label
  const conceptMap: Record<string, Record<string, StoreOption[]>> = {}
  const sortOrderMap: Record<string, number> = {}

  for (const opt of allOptions) {
    if (!conceptMap[opt.concept]) {
      conceptMap[opt.concept] = {}
    }

    const variant = opt.variant_type || 'Other'
    const size = opt.size_label || ''
    const sizeKey = variant + '||' + size

    if (!conceptMap[opt.concept][sizeKey]) {
      conceptMap[opt.concept][sizeKey] = []
    }

    // Deduplicate by store_chain + product_id — keep cheapest for the
    // exact same product at the same store, but allow different products
    // (e.g. store brand vs national brand) to appear as separate cards
    // even when sold at the same chain.
    const existing = conceptMap[opt.concept][sizeKey]
    const duplicate = existing.find(
      o => o.store_chain === opt.store_chain && o.product_id === opt.product_id
    )
    if (!duplicate) {
      existing.push(opt)
    } else if (opt.effective_price < duplicate.effective_price) {
      existing[existing.indexOf(duplicate)] = opt
    }

    // Track sort order for concept
    if (
      sortOrderMap[opt.concept] === undefined ||
      opt.sort_order < sortOrderMap[opt.concept]
    ) {
      sortOrderMap[opt.concept] = opt.sort_order
    }
  }

  // Build final structure
  const result: ConceptGroup[] = []

  for (const [concept, sizeMap] of Object.entries(conceptMap)) {
    const sizes: SizeGroup[] = []

    for (const [sizeKey, options] of Object.entries(sizeMap)) {
      const [variant_type, size_label] = sizeKey.split('||')

      // Sort by effective_price ascending
      const sorted = [...options].sort(
        (a, b) => a.effective_price - b.effective_price
      )

      // Mark best
      if (sorted.length > 0) {
        sorted[0].is_best = true
      }

      const best = sorted[0]
      sizes.push({
        key: sizeKey,
        size_label,
        variant_type,
        store_options: sorted,
        best_price: best?.effective_price || 0,
        best_store_chain: best?.store_chain || '',
      })
    }

    // Sort sizes by first option's sort_order
    sizes.sort((a, b) => {
      const aOpt = a.store_options[0]
      const bOpt = b.store_options[0]
      if (!aOpt || !bOpt) return 0
      const aSort =
        allOptions.find(
          o => o.store_chain === aOpt.store_chain && o.variant_type === a.variant_type
        )?.sort_order || 0
      const bSort =
        allOptions.find(
          o => o.store_chain === bOpt.store_chain && o.variant_type === b.variant_type
        )?.sort_order || 0
      return aSort - bSort
    })

    result.push({
      concept,
      display_name: concept.charAt(0).toUpperCase() + concept.slice(1),
      sizes,
    })
  }

  // Sort concepts by sort order
  result.sort(
    (a, b) => (sortOrderMap[a.concept] || 0) - (sortOrderMap[b.concept] || 0)
  )

  return result
}

// ─── Unit helper ──────────────────────────────────────────────────────────────

export function getDefaultUnit(name: string): string {
  const n = name.toLowerCase()
  if (/milk|juice|water|oil/.test(n)) return 'gallon'
  if (/chicken|beef|pork|fish|salmon|turkey|shrimp/.test(n)) return 'lb'
  if (/banana|apple|orange|potato|carrot|onion/.test(n)) return 'lb'
  if (/bread|cereal|pasta|rice|flour/.test(n)) return 'bag'
  if (/soup|beans|tuna|tomato/.test(n)) return 'can'
  if (/soda|beer|wine|bottle/.test(n)) return 'bottle'
  if (/ice cream|yogurt|butter|cheese/.test(n)) return 'pack'
  return 'each'
}
