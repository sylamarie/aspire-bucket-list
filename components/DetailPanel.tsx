'use client'

import { useState, useRef } from 'react'
import { BucketItem, Subtask, GalleryPhoto } from '@/types/bucket'
import { CATS, ROT, fmtDate } from '@/lib/cats'

type PhotoTarget = { type: 'sub'; subId: string } | { type: 'mem' }

interface Props {
  item: BucketItem
  onClose: () => void
  onItemUpdate: (updated: BucketItem) => void
  onEdit: () => void
}

// Gallery stays in localStorage (base64 images); subtasks go to DB
function saveLocally(id: string, subtasks: Subtask[], gallery: GalleryPhoto[]) {
  try { localStorage.setItem(`aspire-rich-${id}`, JSON.stringify({ gallery })) } catch {}
  fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subtasks }),
  }).catch(() => {})
}

function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = ev => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const max = 820
        let w = img.width, h = img.height
        if (w > h && w > max) { h = Math.round(h * max / w); w = max }
        else if (h >= w && h > max) { w = Math.round(w * max / h); h = max }
        const cv = document.createElement('canvas')
        cv.width = w; cv.height = h
        cv.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(cv.toDataURL('image/jpeg', 0.72))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

const stamp = (c: { ink: string; tint: string; label: string }): React.CSSProperties => ({
  display: 'inline-block', padding: '4px 11px',
  border: `1.5px solid ${c.ink}`, borderRadius: 2,
  fontFamily: 'var(--font-nunito), sans-serif',
  fontSize: 12, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase',
  background: c.tint, color: c.ink,
})

export default function DetailPanel({ item, onClose, onItemUpdate, onEdit }: Props) {
  // All rich data lives in local state only — parent is synced on close, not on every change
  const [subtasks, setSubtasks] = useState<Subtask[]>(item.subtasks ?? [])
  const [gallery, setGallery] = useState<GalleryPhoto[]>(item.gallery ?? [])
  const [newSubText, setNewSubText] = useState('')
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [pendingCaption, setPendingCaption] = useState('')
  const [pendingDate, setPendingDate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editDate, setEditDate] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef<PhotoTarget | null>(null)
  const editCaptionRef = useRef('')
  const editDateRef = useRef('')
  editCaptionRef.current = editCaption
  editDateRef.current = editDate

  // Keep refs current so the close handler always has fresh values
  const subtasksRef = useRef(subtasks)
  subtasksRef.current = subtasks
  const galleryRef = useRef(gallery)
  galleryRef.current = gallery

  const c = CATS[item.category] ?? CATS['travel']
  const subsDone = subtasks.filter(s => s.done).length

  const flush = () => {
    onItemUpdate({ ...item, subtasks: subtasksRef.current, gallery: galleryRef.current })
  }

  const handleClose = () => { flush(); onClose() }
  const handleEdit = () => { flush(); onEdit() }

  // ── Checklist handlers ───────────────────────────────────────
  const addSubtask = () => {
    const text = newSubText.trim()
    if (!text) return
    const newSub: Subtask = { id: 's' + Date.now(), text, done: false, photo: null }
    const next = [...subtasksRef.current, newSub]
    setSubtasks(next)
    subtasksRef.current = next
    saveLocally(item.id, next, galleryRef.current)
    setNewSubText('')
  }

  const toggleSub = (subId: string) => {
    const next = subtasksRef.current.map(s => s.id === subId ? { ...s, done: !s.done } : s)
    setSubtasks(next)
    subtasksRef.current = next
    saveLocally(item.id, next, galleryRef.current)
  }

  const deleteSub = (subId: string) => {
    const next = subtasksRef.current.filter(s => s.id !== subId)
    setSubtasks(next)
    subtasksRef.current = next
    saveLocally(item.id, next, galleryRef.current)
  }

  // ── Photo handlers ───────────────────────────────────────────
  const pickPhoto = (target: PhotoTarget) => {
    pendingRef.current = target
    if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click() }
  }

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const target = pendingRef.current
    pendingRef.current = null
    if (!file || !target) return
    let src: string
    try { src = await processImage(file) } catch { return }

    if (target.type === 'sub') {
      const subId = target.subId
      const next = subtasksRef.current.map(s => s.id === subId ? { ...s, photo: src } : s)
      setSubtasks(next)
      subtasksRef.current = next
      saveLocally(item.id, next, galleryRef.current)
    } else {
      setPendingPhoto(src)
      setPendingCaption('')
      setPendingDate('')
    }
  }

  const removeMemory = (photoId: string) => {
    if (editingId === photoId) setEditingId(null)
    const next = galleryRef.current.filter(g => g.id !== photoId)
    setGallery(next)
    galleryRef.current = next
    saveLocally(item.id, subtasksRef.current, next)
  }

  const confirmPending = () => {
    if (!pendingPhoto) return
    const newPhoto: GalleryPhoto = {
      id: 'g' + Date.now(),
      src: pendingPhoto,
      caption: pendingCaption.trim() || undefined,
      date: pendingDate || undefined,
    }
    const next = [...galleryRef.current, newPhoto]
    setGallery(next)
    galleryRef.current = next
    saveLocally(item.id, subtasksRef.current, next)
    setPendingPhoto(null)
    setPendingCaption('')
    setPendingDate('')
  }

  const saveEdit = (id: string) => {
    const next = galleryRef.current.map(g =>
      g.id === id
        ? { ...g, caption: editCaptionRef.current.trim() || undefined, date: editDateRef.current || undefined }
        : g
    )
    setGallery(next)
    galleryRef.current = next
    saveLocally(item.id, subtasksRef.current, next)
    setEditingId(null)
  }

  const fmtPhotoDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #e0d2b6', borderRadius: 2,
    background: '#f3ead8', color: '#8a7d6c', cursor: 'pointer',
  }

  return (
    <div
      className="asp-fade"
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 55,
        background: 'rgba(34,16,52,.62)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '42px 22px', overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 720,
          background: '#fbf6ea', border: '1px solid #e0d2b6',
          boxShadow: '0 50px 110px -40px rgba(30,0,50,.7)',
        }}
      >
        {/* Decorative stitched frame */}
        <div style={{ position: 'absolute', inset: 10, border: '1.5px dashed #ddccab', pointerEvents: 'none' }} />
        {/* Red binding line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 46, width: 1.5, background: '#e9b3a8', opacity: .5, pointerEvents: 'none' }} />

        {/* Header buttons */}
        <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 3, display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleEdit}
            style={{ ...btnBase, width: 'auto', padding: '7px 14px', gap: 6, fontSize: 13, fontFamily: 'var(--font-nunito), sans-serif' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={handleClose}
            style={{ ...btnBase, width: 36, height: 36 }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{ position: 'relative', padding: '36px 40px 44px 64px' }}>

          {/* Item header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', paddingRight: 120 }}>
            <span style={stamp(c)}>{c.label}</span>
            <span className="asp-hand" style={{ fontSize: 20, color: '#a08766' }}>
              {item.done ? '✓ achieved' : fmtDate(item.target_date)}
            </span>
          </div>

          <h3 style={{
            margin: 0, paddingRight: 60,
            fontFamily: 'var(--font-nunito), sans-serif',
            fontWeight: 500, fontSize: 34, lineHeight: 1.12, color: '#34283a',
          }}>
            {item.title}
          </h3>

          {item.description && (
            <p style={{ margin: '12px 0 0', fontSize: 17, lineHeight: 1.6, color: '#6b6052' }}>
              {item.description}
            </p>
          )}

          {subtasks.length > 0 && (
            <p className="asp-hand" style={{ margin: '14px 0 0', fontSize: 20, color: '#9a6a4a' }}>
              {subsDone} of {subtasks.length} ticked off so far
            </p>
          )}

          {/* ── Checklist ── */}
          <div style={{ marginTop: 32 }}>
            <h4 style={{
              margin: '0 0 4px',
              fontFamily: 'var(--font-nunito), sans-serif',
              fontWeight: 500, fontSize: 22, color: '#34283a',
            }}>
              The checklist
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#a89c89' }}>
              Tick what&apos;s done · tap the photo box to attach a memory.
            </p>

            {subtasks.map((s, si) => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '11px 4px', borderBottom: '1px solid #e8dcc2',
                }}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleSub(s.id)}
                  style={{
                    flex: 'none',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 25, height: 25, borderRadius: '50%', cursor: 'pointer',
                    border: `1.5px solid ${s.done ? c.ink : '#c6b793'}`,
                    background: s.done ? c.ink : '#fffdf6',
                    transition: 'all .15s ease',
                  }}
                >
                  {s.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbf6ea" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>

                {/* Photo thumbnail */}
                <div
                  onClick={() => pickPhoto({ type: 'sub', subId: s.id })}
                  title="Click to attach a photo"
                  style={{
                    flex: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 48, height: 48, overflow: 'hidden', cursor: 'pointer',
                    background: '#fff', padding: '3px 3px 8px',
                    boxShadow: '1px 2px 5px rgba(58,30,61,.12)',
                    transform: `rotate(${si % 2 ? 2 : -2}deg)`,
                    border: '1px solid #ece4d2',
                  }}
                >
                  {s.photo
                    ? <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b6a98f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15V8a2 2 0 0 0-2-2h-3.2l-1-2H9.2l-1 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h7"/>
                        <circle cx="11" cy="12" r="3"/>
                        <path d="M19 16v6M16 19h6"/>
                      </svg>
                    )
                  }
                </div>

                <span style={{
                  flex: 1,
                  fontFamily: 'var(--font-nunito), sans-serif', fontSize: 17,
                  color: s.done ? '#a89c89' : '#33293a',
                  textDecoration: s.done ? 'line-through' : 'none', textDecorationColor: '#cabb9f',
                }}>
                  {s.text}
                </span>

                <button
                  type="button"
                  onClick={() => deleteSub(s.id)}
                  style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', color: '#c9bca5', cursor: 'pointer', borderRadius: 2 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}

            {/* Add row */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <input
                value={newSubText}
                onChange={e => setNewSubText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
                placeholder="Add a line to the checklist…"
                style={{
                  flex: 1, padding: '10px 4px', border: 'none', outline: 'none',
                  borderBottom: '1.5px solid #d9c9a8', background: 'transparent',
                  fontFamily: 'var(--font-nunito), sans-serif', fontSize: 16, color: '#34283a',
                }}
              />
              <button
                type="button"
                onClick={addSubtask}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '10px 16px', border: '1px solid #cdbf9f', borderRadius: 2,
                  background: '#f3ead8', color: '#5a4a2f',
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add
              </button>
            </div>
          </div>

          {/* ── Gallery ── */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <h4 style={{
                margin: 0,
                fontFamily: 'var(--font-nunito), sans-serif',
                fontWeight: 500, fontSize: 22, color: '#34283a',
              }}>
                Memories &amp; mementos
              </h4>
              <span className="asp-hand" style={{ fontSize: 18, color: '#a89c89' }}>
                {gallery.length
                  ? `${gallery.length} ${gallery.length === 1 ? 'memory' : 'memories'} kept`
                  : 'nothing pasted yet'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 18 }}>
              {gallery.map((g, gi) => (
                <div
                  key={g.id}
                  style={{
                    position: 'relative', background: '#fff', padding: '8px 8px 6px',
                    boxShadow: '2px 4px 12px rgba(58,30,61,.16)',
                    transform: editingId === g.id ? 'none' : `rotate(${ROT[gi % ROT.length]}deg)`,
                    border: editingId === g.id ? '2px solid #c9b88a' : '1px solid #ece4d2',
                    transition: 'transform .15s ease, border .15s ease',
                  }}
                >
                  <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: 58, height: 18, background: 'rgba(200,176,120,.4)', border: '1px solid rgba(180,150,90,.25)' }} />
                  <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#ece4d2' }}>
                    <img src={g.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {editingId === g.id ? (
                    <div style={{ paddingTop: 6 }}>
                      <input
                        autoFocus
                        value={editCaption}
                        onChange={e => setEditCaption(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(g.id); if (e.key === 'Escape') setEditingId(null) }}
                        placeholder="caption…"
                        style={{
                          display: 'block', width: '100%', border: 'none', borderBottom: '1px solid #d9c9a8',
                          outline: 'none', background: 'transparent', textAlign: 'center',
                          fontFamily: "var(--font-gochi), 'Chalkboard SE', Chalkboard, cursive", fontSize: 15, color: '#34283a',
                          padding: '2px 0 3px', boxSizing: 'border-box', marginBottom: 4,
                        }}
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(g.id); if (e.key === 'Escape') setEditingId(null) }}
                        style={{
                          display: 'block', width: '100%', border: 'none', borderBottom: '1px solid #d9c9a8',
                          outline: 'none', background: 'transparent', textAlign: 'center',
                          fontSize: 11, color: '#a08766', padding: '2px 0', boxSizing: 'border-box', marginBottom: 6,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button
                          type="button"
                          onClick={() => saveEdit(g.id)}
                          style={{
                            flex: 1, padding: '4px', border: '1px solid #cdbf9f', borderRadius: 1,
                            background: '#f3ead8', color: '#5a4a2f', cursor: 'pointer',
                            fontFamily: 'var(--font-nunito), sans-serif', fontSize: 12,
                          }}
                        >✓ save</button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={{
                            flex: 'none', padding: '4px 7px', border: '1px solid #e0d2b6', borderRadius: 1,
                            background: 'transparent', color: '#a89c89', cursor: 'pointer', fontSize: 12,
                          }}
                        >✕</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setEditingId(g.id); setEditCaption(g.caption ?? ''); setEditDate(g.date ?? '') }}
                      title="Click to edit caption or date"
                      style={{ cursor: 'text', paddingTop: 4, minHeight: 30 }}
                    >
                      <div className="asp-chalk" style={{ textAlign: 'center', fontSize: 15, color: g.caption ? '#34283a' : '#c4b8a0' }}>
                        {g.caption || 'add a caption…'}
                      </div>
                      {g.date && (
                        <div className="asp-chalk" style={{ textAlign: 'center', fontSize: 12, color: '#a08766', marginTop: 2 }}>
                          {fmtPhotoDate(g.date)}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMemory(g.id)}
                    style={{
                      position: 'absolute', top: 6, right: 6, zIndex: 2,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, border: 'none', borderRadius: 1,
                      background: 'rgba(34,16,52,.6)', color: '#fff', cursor: 'pointer',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}

              {pendingPhoto && (
                <div style={{ position: 'relative', background: '#fff', padding: '8px 8px 8px', boxShadow: '2px 4px 12px rgba(58,30,61,.16)', border: '2px solid #c9b88a' }}>
                  <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: 58, height: 18, background: 'rgba(200,176,120,.4)', border: '1px solid rgba(180,150,90,.25)' }} />
                  <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#ece4d2', marginBottom: 6 }}>
                    <img src={pendingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <input
                    autoFocus
                    value={pendingCaption}
                    onChange={e => setPendingCaption(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmPending()}
                    placeholder="add a caption…"
                    style={{
                      display: 'block', width: '100%', border: 'none', borderBottom: '1px solid #d9c9a8',
                      outline: 'none', background: 'transparent', textAlign: 'center',
                      fontFamily: "var(--font-gochi), 'Chalkboard SE', Chalkboard, cursive", fontSize: 15, color: '#34283a',
                      padding: '2px 0 3px', boxSizing: 'border-box', marginBottom: 4,
                    }}
                  />
                  <input
                    type="date"
                    value={pendingDate}
                    onChange={e => setPendingDate(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirmPending()}
                    style={{
                      display: 'block', width: '100%', border: 'none', borderBottom: '1px solid #d9c9a8',
                      outline: 'none', background: 'transparent', textAlign: 'center',
                      fontSize: 11, color: '#a08766', padding: '2px 0', boxSizing: 'border-box', marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button
                      type="button"
                      onClick={confirmPending}
                      style={{
                        flex: 1, padding: '5px', border: '1px solid #cdbf9f', borderRadius: 1,
                        background: '#f3ead8', color: '#5a4a2f', cursor: 'pointer',
                        fontFamily: 'var(--font-nunito), sans-serif', fontSize: 12,
                      }}
                    >save</button>
                    <button
                      type="button"
                      onClick={() => setPendingPhoto(null)}
                      style={{
                        flex: 'none', padding: '5px 8px', border: '1px solid #e0d2b6', borderRadius: 1,
                        background: 'transparent', color: '#a89c89', cursor: 'pointer', fontSize: 12,
                      }}
                    >✕</button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => pickPhoto({ type: 'mem' })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, aspectRatio: '.82',
                  border: '1.5px dashed #cdbf9f', background: '#fffdf6',
                  color: '#a89c89', cursor: 'pointer',
                  fontFamily: 'var(--font-caveat), cursive', fontSize: 18,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15V8a2 2 0 0 0-2-2h-3.2l-1-2H9.2l-1 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h7"/>
                  <circle cx="11" cy="12" r="3"/>
                  <path d="M19 16v6M16 19h6"/>
                </svg>
                tape a photo
              </button>
            </div>
          </div>

        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onFilePicked} style={{ display: 'none' }} />
    </div>
  )
}
