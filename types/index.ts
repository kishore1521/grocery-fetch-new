export type Store = {
  id: string
  name: string
  chain: string
  address: string | null
  zip_code: string | null
  has_loyalty: boolean
  loyalty_name: string | null
  is_active: boolean
}

export type Product = {
  id: string
  name: string
  brand: string | null
  category: string
  unit: string | null
  concept: string | null
  variant_type: string | null
  size_label: string | null
  image_url: string | null
  upc: string | null
  description: string | null
}

export type Price = {
  id: string
  product_id: string
  store_id: string
  regular_price: number
  loyalty_price: number | null
  sale_price: number | null
  in_stock: boolean
  last_updated: string
  source: string
}

export type GroceryList = {
  id: string
  user_id: string
  name: string
  created_at: string
  is_completed: boolean
  store_preference_id: string | null
  estimated_total: number | null
  trip_date: string | null
}

export type GroceryListItem = {
  id: string
  list_id: string
  product_id: string | null
  custom_item_name: string | null
  quantity: number
  unit: string | null
  notes: string | null
  is_checked: boolean
  price_at_add: number | null
  product?: Product
}

export type UserPreferences = {
  id: string
  user_id: string
  zip_code: string | null
  household_size: string | null
  weekly_budget: string | null
  shopping_frequency: string | null
  price_sensitivity: string | null
  has_loyalty_shoprite: boolean
  has_loyalty_stopandshop: boolean
  preferred_stores: string[]
  streak_count: number
  last_receipt_date: string | null
  longest_streak: number
  total_receipts_scanned: number
  total_savings_alltime: number
  total_savings_this_month: number
  savings_month_year: string | null
}

export type Budget = {
  id: string
  user_id: string
  monthly_budget: number
  month_year: string
  spent_so_far: number
  trip_count: number
}

export type Receipt = {
  id: string
  user_id: string
  store_id: string | null
  total_paid: number
  scan_date: string
  raw_json: Record<string, unknown>
  potential_savings: number
  actual_savings: number
  image_url: string | null
}

export type ReceiptItem = {
  id: string
  receipt_id: string
  product_id: string | null
  name_raw: string
  price_paid: number
  regular_price: number | null
  loyalty_savings: number | null
  quantity: number
}

export type SavingsEvent = {
  id: string
  user_id: string
  event_type: string
  amount_saved: number
  amount_paid: number
  best_possible: number
  store_name: string
  receipt_id: string | null
  created_at: string
  month_year: string
}

export type HouseholdMember = {
  id: string
  owner_user_id: string
  member_user_id: string | null
  invited_email: string
  status: string
  created_at: string
}
