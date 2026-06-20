import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await getSupabase()
    .from('bucket_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { title, description, category, target_date } = await req.json()

  const { data, error } = await getSupabase()
    .from('bucket_items')
    .insert({
      title,
      description: description || null,
      category: String(category).toLowerCase(),
      target_date: target_date || null,
      done: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
