import { getSupabase } from '@/lib/supabase'
import BucketListClient from '@/components/BucketListClient'
import { BucketItem } from '@/types/bucket'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { data, error } = await getSupabase()
    .from('bucket_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error('Supabase fetch error:', error.message)

  const items: BucketItem[] = ((data ?? []) as unknown[]).map(r => {
    const row = r as BucketItem
    return {
      ...row,
      category: (row.category?.toLowerCase() ?? 'travel') as BucketItem['category'],
      subtasks: [],
      gallery: [],
    }
  })

  return <BucketListClient initialItems={items} />
}
