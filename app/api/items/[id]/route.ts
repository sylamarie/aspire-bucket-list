import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()

  // Normalize category to lowercase if present
  if (body.category) body.category = String(body.category).toLowerCase()

  const { data, error } = await getSupabase()
    .from('bucket_items')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase update error:', error)
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
