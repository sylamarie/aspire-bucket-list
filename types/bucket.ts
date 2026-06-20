export type Category = 'travel' | 'experience' | 'skill' | 'goal'

export interface Subtask {
  id: string
  text: string
  done: boolean
  photo: string | null
}

export interface GalleryPhoto {
  id: string
  src: string
}

export interface BucketItem {
  id: string
  title: string
  description: string | null
  category: Category
  target_date: string | null
  done: boolean
  subtasks: Subtask[]
  gallery: GalleryPhoto[]
  created_at: string
}
