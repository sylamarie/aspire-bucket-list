'use client'

import { useState } from 'react'
import { BucketItem, Category } from '@/types/bucket'
import { CATS, CAT_KEYS } from '@/lib/cats'

interface SaveData {
  title: string
  description: string
  category: Category
  target_date: string
}

interface Props {
  item: BucketItem | null
  defaultCategory: Category
  onSave: (data: SaveData) => void
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '11px 4px',
  border: 'none',
  borderBottom: '1.5px solid #d9c9a8',
  background: 'transparent',
  fontFamily: 'var(--font-newsreader), Georgia, serif',
  fontSize: 16,
  color: '#34283a',
  boxSizing: 'border-box',
  transition: 'border-color .15s ease',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: '#a89c89',
  marginBottom: 6,
  fontFamily: 'var(--font-newsreader), Georgia, serif',
}

export default function AddEditModal({ item, defaultCategory, onSave, onClose }: Props) {
  const [category, setCategory] = useState<Category>(item?.category ?? defaultCategory)
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [targetDate, setTargetDate] = useState(item?.target_date ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), description: description.trim(), category, target_date: targetDate })
    setSaving(false)
  }

  return (
    <div
      className="asp-fade"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(34,16,52,.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        className="asp-pop"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 520,
          background: '#fbf6ea',
          border: '1px solid #e3d5b8',
          boxShadow: '0 40px 90px -30px rgba(30,0,50,.6)',
          padding: 36,
        }}
      >
        {/* Stitched inner frame */}
        <div style={{ position: 'absolute', inset: 10, border: '1px dashed #ddd0b4', pointerEvents: 'none' }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18, zIndex: 2,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, border: '1px solid #e0d2b6', borderRadius: 2,
            background: '#f3ead8', color: '#8a7d6c', cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Header */}
        <div style={{ marginBottom: 26 }}>
          <span className="asp-hand" style={{ fontSize: 19, color: '#a08766' }}>
            {item ? 'editing an entry' : 'a new line in the book'}
          </span>
          <h3 style={{
            margin: '4px 0 0',
            fontFamily: 'var(--font-newsreader), Georgia, serif',
            fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: '#2f2535', lineHeight: 1.1,
          }}>
            {item ? 'Update aspiration' : 'Add an aspiration'}
          </h3>
        </div>

        {/* Category picker */}
        <label style={LABEL_STYLE}>Category</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {CAT_KEYS.map(k => {
            const c = CATS[k]
            const active = category === k
            return (
              <button
                key={k}
                onClick={() => setCategory(k)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 2,
                  fontFamily: 'var(--font-newsreader), Georgia, serif',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all .15s ease',
                  border: `1.5px solid ${active ? c.ink : '#d9c9a8'}`,
                  background: active ? c.tint : 'transparent',
                  color: active ? c.ink : '#9a8e7e',
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label style={LABEL_STYLE}>
            What do you want to do?{' '}
            <span style={{ color: '#a83f63', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="e.g. See the Northern Lights"
            style={INPUT_STYLE}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={LABEL_STYLE}>Why it matters · the details</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Make it specific and personal…"
            rows={3}
            style={{ ...INPUT_STYLE, resize: 'vertical' }}
          />
        </div>

        {/* Target date */}
        <div style={{ marginBottom: 28 }}>
          <label style={LABEL_STYLE}>
            Target date{' '}
            <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#c9bca5' }}>(optional)</span>
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 20px', border: '1px solid #d9c9a8', borderRadius: 2,
              background: 'transparent', color: '#7a6e5f',
              fontFamily: 'var(--font-newsreader), Georgia, serif', fontSize: 15, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            style={{
              padding: '11px 22px', border: '1.5px solid #5b4694', borderRadius: 2,
              background: saving || !title.trim() ? '#e6e0f1' : '#5b4694',
              color: saving || !title.trim() ? '#9a8fb0' : '#fbf6ea',
              fontFamily: 'var(--font-newsreader), Georgia, serif', fontSize: 15, fontWeight: 600,
              cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
              transition: 'all .15s ease',
            }}
          >
            {saving ? 'Saving…' : item ? 'Save changes' : 'Write it in'}
          </button>
        </div>
      </div>
    </div>
  )
}
