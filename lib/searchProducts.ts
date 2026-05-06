import { supabase } from './supabase'
import { Product } from '../types'

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return []
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${query.trim()}%`)
      .order('name')
      .limit(20)

    if (error) throw error
    return (data ?? []) as Product[]
  } catch (e: unknown) {
    console.error('[searchProducts] error:', e)
    return []
  }
}
