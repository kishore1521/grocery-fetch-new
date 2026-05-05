// Supabase Edge Function — scan-receipt
// Receives base64 receipt image, calls Gemini 2.5 Flash, returns structured JSON
// GEMINI_API_KEY is set in Supabase Edge Function environment — never in the app

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  // Placeholder — implement in Week 5
  return new Response(
    JSON.stringify({ error: 'Not implemented yet' }),
    { headers: { 'Content-Type': 'application/json' }, status: 501 }
  )
})
