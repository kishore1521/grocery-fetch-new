# CLAUDE.md — Grocery Fetch
# READ THIS FILE COMPLETELY BEFORE WRITING ANY CODE
# Last updated: May 2026
# Project stage: Week 0 — Setup complete, starting Week 1

---

## WHAT THIS APP IS

Grocery Fetch is a mobile-first grocery list and price comparison app
for Long Island, NY families and households.

Core value: Users build their grocery list in the app, the app tells
them which nearby store saves them the most money, and over time the
app learns their shopping patterns to help them make smarter decisions.

Core user: Long Island families and households (individuals, couples,
families) who want a better way to plan grocery shopping, find the
cheapest store near them, track spending, and stay on budget.

Core problem: No proper way to track grocery spending, no easy plan or
budget, no simple way to know where to shop to save money.

One sentence: "Grocery Fetch helps Long Island families build their
grocery list and find the cheapest store near them."

GitHub: git@github.com:kishore1521/grocery-fetch-new.git
Supabase project: [PASTE YOUR SUPABASE PROJECT URL HERE]

---

## TECH STACK — NEVER DEVIATE FROM THIS

| Layer            | Choice                          | Notes                              |
|------------------|---------------------------------|------------------------------------|
| Mobile           | Expo React Native               | Managed workflow                   |
| Language         | TypeScript                      | Strict mode, never use 'any'       |
| Navigation       | Expo Router (file-based)        | Screens = files in /app folder     |
| Styling          | NativeWind (Tailwind)           | All styling via className          |
| State            | Zustand                         | One store per domain               |
| Auth             | Supabase Auth                   | Email + Google + Guest             |
| Database         | Supabase Postgres               | All tables listed below            |
| Storage          | Supabase Storage                | Receipt images only                |
| Realtime         | Supabase Realtime               | Household list sharing             |
| Serverless       | Supabase Edge Functions         | Receipt scanning (calls Gemini)    |
| Receipt AI       | Gemini 2.5 Flash                | Via Edge Function only             |
| Analytics        | PostHog                         | Track every screen and key action  |
| Crashes          | Sentry                          | Wrap app in Sentry provider        |
| Notifications    | Expo Push Notifications         | V1 only — two notification types   |
| Build/Deploy     | EAS Build                       | TestFlight for iOS beta            |

---

## FILE STRUCTURE — ALWAYS FOLLOW THIS

```
grocery-fetch/
├── CLAUDE.md                    ← YOU ARE HERE
├── app/                         ← All screens (Expo Router)
│   ├── (tabs)/                  ← Bottom tab screens
│   │   ├── index.tsx            ← Home tab
│   │   ├── search.tsx           ← Search tab
│   │   ├── list.tsx             ← My List tab
│   │   └── profile.tsx          ← Profile tab
│   ├── auth/
│   │   ├── login.tsx            ← Login screen
│   │   └── signup.tsx           ← Sign up screen
│   ├── onboarding/
│   │   ├── step1-zip.tsx        ← Zip code
│   │   ├── step2-stores.tsx     ← Store selection
│   │   └── step3-household.tsx  ← Household size
│   ├── store/
│   │   └── [id].tsx             ← Store detail + products
│   ├── product/
│   │   └── [id].tsx             ← Product detail + price comparison
│   ├── receipt/
│   │   ├── upload.tsx           ← Receipt camera/upload
│   │   └── results.tsx          ← Scan results + Price Verdict
│   └── _layout.tsx              ← Root layout with auth guard
├── components/                  ← Reusable UI components
│   ├── ui/                      ← Generic UI (Button, Card, Input)
│   ├── list/                    ← List-specific components
│   ├── store/                   ← Store card components
│   └── product/                 ← Product card components
├── stores/                      ← Zustand state stores
│   ├── authStore.ts             ← User session + profile
│   ├── listStore.ts             ← Grocery list state
│   ├── budgetStore.ts           ← Budget tracking
│   └── priceStore.ts            ← Price data cache
├── lib/
│   ├── supabase.ts              ← Supabase client (anon key only)
│   ├── gemini.ts                ← Gemini API helpers
│   └── helpers.ts               ← Shared utility functions
├── hooks/                       ← Custom React hooks
│   ├── useAuth.ts               ← Auth state hook
│   ├── useList.ts               ← Grocery list hook
│   └── usePrices.ts             ← Price fetching hook
├── constants/
│   ├── colors.ts                ← Design system colors
│   └── stores.ts                ← Store brand colors + names
├── types/
│   └── index.ts                 ← All TypeScript types
├── supabase/
│   └── functions/
│       └── scan-receipt/        ← Edge Function for Gemini
│           └── index.ts
├── assets/                      ← Images, icons, fonts
├── app.json                     ← Expo config
├── tailwind.config.js           ← NativeWind config
└── .env                         ← Environment variables (never commit)
```

---

## ENVIRONMENT VARIABLES

Create a .env file at project root. NEVER commit this file.
Add .env to .gitignore immediately.

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key  (Edge Function only, never in app)
SENTRY_DSN=your_sentry_dsn
POSTHOG_API_KEY=your_posthog_key
```

IMPORTANT: Only EXPO_PUBLIC_ prefixed variables are accessible in
the React Native app. Gemini API key NEVER goes in the app.
It lives ONLY in the Supabase Edge Function environment.

---

## DESIGN SYSTEM

### Colors (define in constants/colors.ts)
```typescript
export const colors = {
  primary: '#00A651',       // Primary green — buttons, active states
  primaryDark: '#007A3D',   // Darker green — pressed states
  primaryLight: '#E8F5EE',  // Light green — backgrounds, badges
  dark: '#0F172A',          // Primary text
  darkSecondary: '#1E293B', // Secondary dark
  gray600: '#475569',       // Secondary text
  gray400: '#94A3B8',       // Tertiary text / placeholders
  gray200: '#E2E8F0',       // Borders
  gray100: '#F1F5F9',       // Input backgrounds
  white: '#FFFFFF',
  background: '#F8FAFC',    // App background
  orange: '#F97316',        // Loyalty prices, savings alerts
  orangeLight: '#FFF3ED',   // Orange badge background
  red: '#EF4444',           // Errors, delete
  success: '#00C853',       // Best price badges
  
  // Store brand colors
  shoprite: '#CC0000',
  stopandshop: '#007A3D',
  target: '#E53935',
  walmart: '#0071CE',
  aldi: '#1E3A5F',
}
```

### Typography rules
- Headings: font-weight 700-800, letter-spacing -0.3px to -0.8px
- Body: font-weight 400, line-height 1.5
- Prices: font-weight 700-800, font-variant-numeric tabular-nums
- Labels: font-weight 500-600, letter-spacing 0.04-0.08em
- Never use font size below 11px

### Spacing
- Screen horizontal padding: 20px (px-5 in Tailwind)
- Card padding: 16px (p-4)
- Section gaps: 24px (gap-6)
- Item gaps: 12px (gap-3)

### Component standards
- All cards: rounded-2xl (16px), shadow-sm
- All inputs: rounded-xl (12px), h-13 (52px)
- All primary buttons: rounded-xl (12px), h-13 (52px), bg-primary
- Minimum touch target: 44x44px on all interactive elements
- Press animation: scale-95 on active state (all buttons)

---

## DATABASE SCHEMA — COMPLETE REFERENCE

Supabase project: [YOUR PROJECT URL]
Region: US East (N. Virginia)
All tables are in the 'public' schema.
RLS is enabled on all tables.

### TABLE: users
Extended auth profile. References auth.users.
```
id              uuid  PK, references auth.users
email           text
is_guest        boolean  default false
created_at      timestamp  default now()
last_seen       timestamp  default now()
```

### TABLE: user_preferences
Onboarding answers + streak + savings data.
```
id                        uuid  PK
user_id                   uuid  FK → users.id
zip_code                  text
household_size            text  ('1','2','3-4','5+')
weekly_budget             text  ('under100','100-200','200-300','300+')
shopping_frequency        text  ('daily','2-3week','weekly','biweekly')
price_sensitivity         text  ('always_cheapest','balance','convenience')
has_loyalty_shoprite      boolean  default false
has_loyalty_stopandshop   boolean  default false
preferred_stores          text[]
streak_count              integer  default 0
last_receipt_date         date
longest_streak            integer  default 0
total_receipts_scanned    integer  default 0
total_savings_alltime     decimal(10,2)  default 0
total_savings_this_month  decimal(10,2)  default 0
savings_month_year        text  ('2025-01' format)
created_at                timestamp  default now()
```

### TABLE: stores
The 5 Long Island grocery stores.
```
id            uuid  PK
name          text  (e.g. 'ShopRite of Westbury')
chain         text  (e.g. 'ShopRite')
address       text
zip_code      text
has_loyalty   boolean  default false
loyalty_name  text  (e.g. 'Price Plus', 'GO Rewards')
is_active     boolean  default true
```

Current stores:
- ShopRite of Westbury (ShopRite, Price Plus, zip: 11590)
- Stop & Shop Hicksville (Stop & Shop, GO Rewards, zip: 11801)
- Target Carle Place (Target, no loyalty, zip: 11514)
- Walmart Supercenter Levittown (Walmart, no loyalty, zip: 11756)
- Aldi Westbury (Aldi, no loyalty, zip: 11590)

### TABLE: products
Product catalog.
```
id           uuid  PK
name         text  (e.g. 'Whole Milk')
brand        text  (e.g. 'Garelick Farms')
category     text  (produce/dairy/meat/bakery/frozen/pantry/beverages/household/deli/other)
unit         text  (e.g. '1 Gallon', 'Per Lb', '1 Dozen')
image_url    text
upc          text  (barcode — critical for accurate matching)
description  text
```

Current products: Whole Milk, Large Eggs, Boneless Chicken Breast,
White Sandwich Bread, Orange Juice.

### TABLE: prices
The core price data. One row per product × store combination.
```
id             uuid  PK
product_id     uuid  FK → products.id
store_id       uuid  FK → stores.id
regular_price  decimal(10,2)
loyalty_price  decimal(10,2)  nullable
sale_price     decimal(10,2)  nullable
in_stock       boolean  default true
last_updated   timestamp  default now()
source         text  ('manual','receipt','community')
```

### TABLE: grocery_lists
Named grocery lists per user.
```
id                    uuid  PK
user_id               uuid  FK → users.id
name                  text  default 'My List'
created_at            timestamp  default now()
is_completed          boolean  default false
store_preference_id   uuid  FK → stores.id  nullable
estimated_total       decimal(10,2)
trip_date             date
```

### TABLE: grocery_list_items
Individual items within a list.
```
id                uuid  PK
list_id           uuid  FK → grocery_lists.id
product_id        uuid  FK → products.id  nullable (null for custom items)
custom_item_name  text  nullable (for items not in database)
quantity          integer  default 1
unit              text  nullable
notes             text  nullable
is_checked        boolean  default false
price_at_add      decimal(10,2)  nullable
```

### TABLE: household_members
Shared list access between two users.
```
id              uuid  PK
owner_user_id   uuid  FK → users.id
member_user_id  uuid  FK → users.id  nullable
invited_email   text
status          text  ('pending','accepted','declined')
created_at      timestamp  default now()
```
Unique constraint: (owner_user_id, member_user_id)

### TABLE: receipts
Scanned receipt header.
```
id                uuid  PK
user_id           uuid  FK → users.id
store_id          uuid  FK → stores.id  nullable
total_paid        decimal(10,2)
scan_date         timestamp  default now()
raw_json          jsonb  (full Gemini extraction output)
potential_savings decimal(10,2)
actual_savings    decimal(10,2)
image_url         text  (Supabase Storage path — deleted within 24hrs)
```

### TABLE: receipt_items
Individual line items from a receipt.
```
id              uuid  PK
receipt_id      uuid  FK → receipts.id
product_id      uuid  FK → products.id  nullable
name_raw        text  (exact text from receipt)
price_paid      decimal(10,2)
regular_price   decimal(10,2)  nullable
loyalty_savings decimal(10,2)  nullable
quantity        integer  default 1
```

### TABLE: savings_events
Log of every savings moment. Powers home card.
```
id            uuid  PK
user_id       uuid  FK → users.id
event_type    text  ('receipt_scan','list_optimization','price_alert')
amount_saved  decimal(10,2)
amount_paid   decimal(10,2)
best_possible decimal(10,2)
store_name    text
receipt_id    uuid  FK → receipts.id  nullable
created_at    timestamp  default now()
month_year    text  ('2025-01' format)
```

### TABLE: budgets
Monthly budget per user. Auto-updated by database trigger.
```
id              uuid  PK
user_id         uuid  FK → users.id
monthly_budget  decimal(10,2)
month_year      text  ('2025-01' format)
spent_so_far    decimal(10,2)  default 0
trip_count      integer  default 0
created_at      timestamp  default now()
updated_at      timestamp  default now()
```
Unique constraint: (user_id, month_year)
Note: spent_so_far auto-updates via on_receipt_inserted trigger.

### TABLE: price_requests
User requests to track a product we don't have yet.
```
id            uuid  PK
user_id       uuid  FK → users.id
product_name  text
store_name    text  nullable
notes         text  nullable
status        text  ('pending','added','declined')
created_at    timestamp  default now()
```

### TABLE: weekly_summaries
Pre-computed weekly stats for fast home screen loading.
```
id            uuid  PK
user_id       uuid  FK → users.id
week_start    date
total_spent   decimal(10,2)  default 0
total_saved   decimal(10,2)  default 0
trips_count   integer  default 0
best_store    text
created_at    timestamp  default now()
```

### TABLE: share_cards
Generated savings share cards.
```
id            uuid  PK
user_id       uuid  FK → users.id
card_type     text  ('monthly_savings','streak','single_trip')
amount_saved  decimal(10,2)
message       text
created_at    timestamp  default now()
```

### INDEXES
All critical indexes created:
- prices(product_id, store_id)
- prices(store_id)
- prices(last_updated)
- receipts(user_id)
- receipts(scan_date)
- receipt_items(receipt_id)
- grocery_list_items(list_id)
- savings_events(user_id, month_year)
- products(category)
- products(upc)

### DATABASE TRIGGER
on_receipt_inserted: fires after INSERT on receipts.
Auto-updates budgets table with spent_so_far and trip_count.

---

## SUPABASE CLIENT SETUP

### lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Keep session alive when app comes back to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

---

## KEY TYPES (types/index.ts)

```typescript
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
```

---

## EDGE FUNCTION: scan-receipt

Located at: supabase/functions/scan-receipt/index.ts
Triggered by: POST request from the app with a receipt image

What it does:
1. Receives base64 image from app
2. Validates it's a grocery receipt
3. Extracts all items, prices, loyalty savings using Gemini 2.5 Flash
4. Returns structured JSON
5. App saves result to receipts + receipt_items tables

Gemini model: gemini-2.5-flash (NOT gemini-2.0-flash — that's deprecated)
GEMINI_API_KEY is set in Supabase Edge Function environment variables.
NEVER pass the Gemini key to the mobile app.

---

## CODING STANDARDS — ALWAYS FOLLOW THESE

1. TypeScript strict mode. Never use 'any' type.
2. Every Supabase call wrapped in try/catch with user-friendly error.
3. Every screen has: loading state, error state, empty state, data state.
4. All monetary values: Number(value).toFixed(2)
5. All dates: ISO string from Supabase, format for display with helper.
6. Components: functional only, no class components.
7. No inline styles — NativeWind className only.
8. Zustand stores: one file per domain, no cross-store imports.
9. Never hardcode store names, IDs, or prices — always from database.
10. All images need fallback (loading state + error state).

### Error handling pattern (use everywhere):
```typescript
try {
  const { data, error } = await supabase.from('table').select('*')
  if (error) throw error
  // use data
} catch (error) {
  console.error('[context] Error:', error)
  // show user-friendly message — never expose raw error to user
  Alert.alert('Something went wrong', 'Please try again.')
}
```

### Loading state pattern (use on every screen):
```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [data, setData] = useState<YourType[]>([])

// Always set loading false in finally block
try {
  setLoading(true)
  // fetch data
} catch (e) {
  setError('Failed to load. Please try again.')
} finally {
  setLoading(false)
}
```

---

## V1 FEATURES — BUILD THESE AND ONLY THESE

Week 1:
- [ ] Login (email/password + Google + guest)
- [ ] Sign up
- [ ] Onboarding (3 steps: zip, stores, household size)
- [ ] Route guard (not logged in → login screen)

Week 2:
- [ ] My List tab (empty state + list display)
- [ ] Add product from database (search)
- [ ] Add custom item (free text)
- [ ] Auto-categorize items
- [ ] Check off items
- [ ] Delete items (swipe left)
- [ ] Repeat last list

Week 3:
- [ ] Live cost estimate (per-store running total as list is built)
- [ ] Where to shop screen (cheapest store + split trip option)
- [ ] Price search tab
- [ ] Product detail with price comparison

Week 4:
- [ ] Budget setup and home widget
- [ ] Home screen (active list preview + store grid + budget)
- [ ] Profile tab
- [ ] Account deletion (App Store required)
- [ ] Household sharing (invite by email)

Week 5:
- [ ] Receipt upload (camera + photo library)
- [ ] Supabase Edge Function for Gemini scanning
- [ ] Receipt results (Price Verdict screen)
- [ ] Budget auto-update from receipt
- [ ] Add receipt items to next list
- [ ] Streak tracking + celebration screen

Week 6:
- [ ] Polish: empty states, loading states, error states
- [ ] Contextual tutorial tooltips (first-use only)
- [ ] Basic push notifications (Thursday reminder)
- [ ] App icon + splash screen
- [ ] Privacy policy live URL
- [ ] TestFlight build + submit

DO NOT BUILD (V2+):
- Price history charts
- Smart AI-suggested lists
- Barcode scanner
- Recipe-to-list
- Coupon/deal alerts
- Community price reports
- Multiple named lists
- Spending analytics charts

---

## COMPLIANCE CHECKLIST

- [ ] Apple Developer Account ($99/year) — developer.apple.com
- [ ] Google Play Account ($25 one-time)
- [ ] Privacy policy live URL (Termly.io, $14/month)
- [ ] Age gate on signup (13+ required, COPPA)
- [ ] Account deletion in-app (required by Apple)
- [ ] Receipt images deleted within 24 hours of processing
- [ ] PostHog analytics disclosure in privacy policy
- [ ] Gemini (Google) AI processing disclosure in privacy policy
- [ ] Data retention: personal data deleted on account deletion
- [ ] Price data: retained anonymously after account deletion

---

## WHAT TO DO AT THE START OF EVERY CLAUDE CODE SESSION

1. Tell Claude Code: "Read CLAUDE.md before doing anything"
2. State which week you are on
3. State which feature you are currently building
4. Paste any relevant error messages in full
5. After completing a feature, update the checklist in this file

---

## CURRENT STATUS

Week: 1 — Auth + Onboarding
Active branch: main
Last completed: Week 0 — app running on device
Currently building: Login screen
Known issues: None
Next action: Build login screen UI

---

## DECISION LOG

| Date     | Decision                              | Reason                                    |
|----------|---------------------------------------|-------------------------------------------|
| May 2026 | Expo React Native over Flutter        | JS ecosystem, Claude Code knows it deeply |
| May 2026 | Supabase only, no separate server     | Eliminates deployment complexity for V1   |
| May 2026 | NativeWind over StyleSheet            | Faster with AI assistance                 |
| May 2026 | Zustand over Redux                    | Beginner-friendly, no boilerplate         |
| May 2026 | Gemini 2.5 Flash for receipts         | Already validated on Long Island receipts |
| May 2026 | Scrap Replit code, keep Supabase DB   | Web app code not reusable for mobile      |
| May 2026 | TypeScript strict mode                | Better AI assistance, catches errors early|
| May 2026 | 5 stores only for V1                  | Data quality over coverage                |
| May 2026 | 13 features for V1, strict scope      | 4-6 week timeline requires focus          |
| May 2026 | Pin reanimated@3.16.7                 | v4+ needs worklets, incompatible with Expo 54 |
| May 2026 | Manually install expo-linking, react-native-screens | Claude Code missed these  |
| May 2026 | Added handle_new_user trigger         | public.users needs row before user_preferences insert |
| May 2026 | Added unique constraint on user_preferences.user_id | Required for upsert onConflict |
