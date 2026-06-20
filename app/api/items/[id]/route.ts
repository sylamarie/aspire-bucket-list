import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const ALLOWED_FIELDS = ['title', 'description', 'category', 'target_date', 'done'] as const
const VALID_CATEGORIES = new Set(['travel', 'experience', 'skill', 'goal'])

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const raw = await req.json()

  // Whitelist fields — never pass arbitrary user input directly to update()
  const body: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in raw) body[key] = raw[key]
  }

  // Normalize values
  if (body.category) {
    body.category = String(body.category).toLowerCase()
    if (!VALID_CATEGORIES.has(body.category as string)) {
      return NextResponse.json({ error: 'invalid category' }, { status: 400 })
    }
  }
  if (body.target_date === '') body.target_date = null
  if ('description' in body && body.description === '') body.description = null

  const { data, error } = await getSupabase()
    .from('bucket_items')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase update error:', error)
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'item not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    )
  }
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  const { error } = await getSupabase()
    .from('bucket_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Supabase delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
