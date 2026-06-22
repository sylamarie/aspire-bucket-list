'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactConfetti from 'react-confetti'
import { BucketItem, Category, Subtask, GalleryPhoto } from '@/types/bucket'
import { CATS, CAT_KEYS, ROT } from '@/lib/cats'
import BucketCard from './BucketCard'
import AddEditModal from './AddEditModal'
import DetailPanel from './DetailPanel'

type FilterKey = 'all' | Category
type SortKey = 'recent' | 'date' | 'category'

// ── localStorage helpers (gallery only — subtasks live in DB) ─
function loadGallery(id: string): GalleryPhoto[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`aspire-rich-${id}`) : null
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.gallery ?? []
    }
  } catch {}
  return []
}

function saveGallery(id: string, gallery: GalleryPhoto[]) {
  try { localStorage.setItem(`aspire-rich-${id}`, JSON.stringify({ gallery })) } catch {}
}

function removeGallery(id: string) {
  try { localStorage.removeItem(`aspire-rich-${id}`) } catch {}
}

function enrich(items: BucketItem[]): BucketItem[] {
  return items.map(item => ({
    ...item,
    subtasks: item.subtasks ?? [],
    gallery: loadGallery(item.id),
  }))
}

export default function BucketListClient({ initialItems }: { initialItems: BucketItem[] }) {
  const [items, setItems] = useState<BucketItem[]>(() =>
    initialItems.map(item => ({ ...item, subtasks: item.subtasks ?? [], gallery: [] }))
  )
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sortBy, setSortBy] = useState<SortKey>('recent')
  const [showConfetti, setShowConfetti] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null)
  const [openDetailId, setOpenDetailId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load localStorage rich data after hydration
  useEffect(() => {
    setItems(prev => enrich(prev))
  }, [])

  const openAdd = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item: BucketItem) => { setEditingItem(item); setModalOpen(true) }

  const scrollToList = () => {
    const el = document.getElementById('aspire-list')
    if (el) window.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' })
  }

  const handleSave = async (data: { title: string; description: string; category: Category; target_date: string }) => {
    setSaveError(null)
    try {
      if (editingItem) {
        const res = await fetch(`/api/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const saved = await res.json()
          setItems(prev => prev.map(it =>
            it.id === editingItem.id
              ? { ...it, ...saved, subtasks: it.subtasks, gallery: it.gallery }
              : it
          ))
          setModalOpen(false)
        } else {
          const err = await res.json().catch(() => ({}))
          setSaveError((err as { error?: string }).error ?? 'Failed to save. Please try again.')
        }
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const newItem: BucketItem = await res.json()
          const enriched = { ...newItem, subtasks: [], gallery: [] }
          setItems(prev => [enriched, ...prev])
          setShowConfetti(true)
          setModalOpen(false)
        } else {
          const err = await res.json().catch(() => ({}))
          setSaveError((err as { error?: string }).error ?? 'Failed to save. Please try again.')
        }
      }
    } catch {
      setSaveError('Network error. Please check your connection.')
    }
  }

  const handleToggle = async (id: string) => {
    const item = items.find(it => it.id === id)
    if (!item) return
    const newDone = !item.done
    setItems(prev => prev.map(it => it.id === id ? { ...it, done: newDone } : it))
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDone }),
      })
      if (!res.ok) {
        setItems(prev => prev.map(it => it.id === id ? { ...it, done: item.done } : it))
      }
    } catch {
      setItems(prev => prev.map(it => it.id === id ? { ...it, done: item.done } : it))
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find(it => it.id === id)
    if (!item) return
    setItems(prev => prev.filter(it => it.id !== id))
    removeGallery(id)
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setItems(prev => [item, ...prev])
        saveGallery(id, item.gallery)
      }
    } catch {
      setItems(prev => [item, ...prev])
      saveGallery(id, item.gallery)
    }
  }

  const handleItemUpdate = (updated: BucketItem) => {
    setItems(prev => prev.map(it => it.id === updated.id ? updated : it))
    saveGallery(updated.id, updated.gallery)
    fetch(`/api/items/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtasks: updated.subtasks }),
    }).catch(() => {})
  }

  // ── Computed ─────────────────────────────────────────────────
  const total = items.length
  const doneCount = items.filter(i => i.done).length
  const activeCount = total - doneCount
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const counts: Record<string, number> = { all: total }
  CAT_KEYS.forEach(k => { counts[k] = items.filter(i => i.category === k).length })

  let displayItems = (filter === 'all' ? items : items.filter(i => i.category === filter)).slice()
  if (sortBy === 'date') {
    displayItems.sort((a, b) => (a.target_date || '9999').localeCompare(b.target_date || '9999'))
  } else if (sortBy === 'category') {
    displayItems.sort((a, b) => CAT_KEYS.indexOf(a.category) - CAT_KEYS.indexOf(b.category))
  }
  displayItems.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  const defaultCat: Category = (filter !== 'all' ? filter : 'travel') as Category
  const openDetailItem = openDetailId ? items.find(it => it.id === openDetailId) : null

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          recycle={false}
          numberOfPieces={280}
          colors={['#b0603a', '#a83f63', '#3f7355', '#5b4694', '#d4a853', '#e0c98a']}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      {/* ── COVER ────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        background: 'radial-gradient(125% 105% at 50% 8%, #6a2f8f 0%, #4a2168 42%, #2e1547 78%, #221038 100%)',
        overflow: 'hidden',
      }}>
        {/* Hatched texture */}
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.025) 0 2px, transparent 2px 5px)', pointerEvents: 'none' }} />
        {/* Dashed inner frame */}
        <div style={{ position: 'absolute', inset: 26, border: '1.5px dashed rgba(214,182,120,.45)', borderRadius: 8, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 34, border: '1px solid rgba(214,182,120,.16)', borderRadius: 4, pointerEvents: 'none' }} />
        {/* Ribbon bookmark */}
        <div style={{ position: 'absolute', top: 0, left: '18%', width: 26, height: 118, background: 'linear-gradient(#caa765,#a8854a)', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 84%,0 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p className="asp-rise" style={{ margin: '0 0 24px', fontSize: 12, fontWeight: 600, letterSpacing: '.28em', color: 'rgba(212,168,80,.85)', textTransform: 'uppercase', fontFamily: 'var(--font-nunito), sans-serif' }}>
            A Living Journal · Est. 2026
          </p>

          {/* Decorative rule */}
          <div className="asp-rise" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 18, animationDelay: '.04s' }}>
            <div style={{ height: 1, width: 80, background: 'rgba(212,168,80,.4)' }} />
            <span style={{ color: 'rgba(212,168,80,.6)', fontSize: 14 }}>✦</span>
            <div style={{ height: 1, width: 80, background: 'rgba(212,168,80,.4)' }} />
          </div>

          <h1 className="asp-rise" style={{
            margin: 0,
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 'clamp(86px, 16vw, 200px)',
            lineHeight: .9,
            color: '#f5ecd6',
            letterSpacing: '-.01em',
            animationDelay: '.08s',
          }}>
            Aspire
          </h1>

          <div className="asp-rise" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 20, marginBottom: 20, animationDelay: '.12s' }}>
            <div style={{ height: 1, width: 60, background: 'rgba(212,168,80,.35)' }} />
            <span style={{ color: 'rgba(212,168,80,.5)', fontSize: 12 }}>◆</span>
            <div style={{ height: 1, width: 60, background: 'rgba(212,168,80,.35)' }} />
          </div>

          <p className="asp-rise asp-hand" style={{ margin: '0 0 38px', fontSize: 'clamp(20px, 3vw, 28px)', color: 'rgba(235,220,195,.85)', animationDelay: '.16s' }}>
            {total === 0 ? 'a blank page, waiting to be filled' : `the ${total} thing${total === 1 ? '' : 's'} I'm living for`}
          </p>

          <button
            className="asp-rise"
            onClick={scrollToList}
            style={{
              padding: '14px 32px',
              border: '1.5px solid rgba(214,182,120,.6)',
              borderRadius: 2,
              background: 'transparent',
              color: '#f0ddb0',
              fontFamily: 'var(--font-nunito), sans-serif',
              fontSize: 17,
              letterSpacing: '.06em',
              cursor: 'pointer',
              animationDelay: '.2s',
              transition: 'all .2s ease',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(214,182,120,.15)'
              b.style.borderColor = 'rgba(214,182,120,.9)'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'transparent'
              b.style.borderColor = 'rgba(214,182,120,.6)'
            }}
          >
            Open the journal
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 38, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div
            className="asp-float"
            onClick={scrollToList}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(212,168,80,.6)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-nunito), sans-serif' }}
          >
            turn the page
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── PAGES / LIST ─────────────────────────────────────── */}
      <section
        id="aspire-list"
        style={{
          background: '#efe6d6',
          backgroundImage: 'radial-gradient(circle, rgba(168,134,80,.35) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 8px',
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 28px 120px' }}>

          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22 }}>
            <div>
              <span className="asp-hand" style={{ fontSize: 22, color: '#a08766' }}>
                pages of longing &amp; living
              </span>
              <h2 style={{
                margin: '4px 0 0',
                fontFamily: "'Study Daily', var(--font-nunito), sans-serif",
                fontWeight: 400, fontSize: 'clamp(36px,5vw,56px)',
                letterSpacing: '-.01em', color: '#2f2535', lineHeight: 1.05,
              }}>
                My Aspirations
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 15, color: '#8a7d6c', fontFamily: 'var(--font-nunito), sans-serif' }}>
                {total} {total === 1 ? 'dream' : 'dreams'} · {doneCount} achieved · {activeCount} in motion
              </p>
            </div>
            <button
              onClick={openAdd}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px',
                border: '1.5px solid #5b4694', borderRadius: 2,
                background: '#5b4694', color: '#fbf6ea',
                fontFamily: 'var(--font-nunito), sans-serif', fontSize: 16,
                cursor: 'pointer', transition: 'all .18s ease',
                boxShadow: '2px 4px 18px rgba(91,70,148,.35)',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = '#4a3578'
                b.style.borderColor = '#4a3578'
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = '#5b4694'
                b.style.borderColor = '#5b4694'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Write it in
            </button>
          </div>

          {/* Progress ledger */}
          <div style={{
            marginTop: 36, padding: '22px 26px',
            background: '#fffdf6', border: '1px solid #e0d2b6',
            boxShadow: '2px 4px 18px rgba(58,30,61,.08)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 26 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-nunito), sans-serif', fontSize: 16, color: '#6b6052' }}>
                    Progress through the list
                  </span>
                  <span className="asp-hand" style={{ fontSize: 21, color: '#9a6a4a' }}>{pct}% there</span>
                </div>
                <div style={{ height: 14, background: '#f3ead8', border: '1px solid #ddcfb4', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'repeating-linear-gradient(45deg, #b08a4e 0 6px, #9a7842 6px 12px)',
                    transition: 'width .5s cubic-bezier(.16,.84,.44,1)',
                  }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 28 }}>
                {[
                  { label: 'Achieved', val: doneCount },
                  { label: 'In motion', val: activeCount },
                ].map(({ label, val }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 400, fontSize: 34, color: '#34283a', lineHeight: 1 }}>
                      {val}
                    </div>
                    <div style={{ fontSize: 12, color: '#a89c89', letterSpacing: '.04em', marginTop: 4, fontFamily: 'var(--font-nunito), sans-serif' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters + sort */}
          <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* Filter tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ key: 'all', label: 'All' }, ...CAT_KEYS.map(k => ({ key: k, label: CATS[k].label }))].map(({ key, label }) => {
                const active = filter === key
                const c = key !== 'all' ? CATS[key as Category] : null
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key as FilterKey)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                      borderRadius: 2, cursor: 'pointer', transition: 'all .15s ease',
                      fontFamily: 'var(--font-nunito), sans-serif',
                      fontSize: 14, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
                      border: active
                        ? `1.5px solid ${c ? c.ink : '#5b4694'}`
                        : '1.5px solid #d9c9a8',
                      background: active ? (c ? c.tint : '#e6e0f1') : 'transparent',
                      color: active ? (c ? c.ink : '#5b4694') : '#9a8e7e',
                    }}
                  >
                    {label}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 18, height: 18, padding: '0 5px', fontSize: 11, fontWeight: 700,
                      background: active ? 'rgba(255,255,255,.45)' : 'rgba(168,134,80,.12)',
                      color: active ? (c ? c.ink : '#5b4694') : '#a89c89',
                      borderRadius: 1,
                    }}>
                      {counts[key] ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              style={{
                padding: '8px 12px', border: '1px solid #d9c9a8', borderRadius: 2,
                fontFamily: 'var(--font-nunito), sans-serif',
                fontSize: 14, color: '#6b6052', background: '#fffdf6', cursor: 'pointer',
              }}
            >
              <option value="recent">Recently added</option>
              <option value="date">Target date</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Card grid */}
          {displayItems.length > 0 ? (
            <div style={{
              marginTop: 48,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 36,
              paddingBottom: 24,
            }}>
              <AnimatePresence mode="popLayout" initial={false}>
                {displayItems.map((item, idx) => {
                  const rot = item.done ? 0 : ROT[idx % ROT.length]
                  const tapeRot = idx % 2 ? 1.5 : -1.5
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -32, scale: 0.91, rotate: rot + (rot >= 0 ? -6 : 6) }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotate: rot }}
                      exit={{
                        opacity: 0, y: 160, scale: 0.78, rotate: rot + 18,
                        transition: { duration: 0.52, delay: 0.21, ease: [0.4, 0, 0.85, 0.5] },
                      }}
                      transition={{
                        layout: { type: 'spring', damping: 28, stiffness: 360 },
                        default: { type: 'spring', damping: 20, stiffness: 230, mass: 0.85 },
                      }}
                      style={{ position: 'relative' }}
                    >
                      {/* Tape — left-to-right apply on enter, left-to-right peel on exit */}
                      <motion.div
                        initial={{ clipPath: 'inset(0 100% 0 0)', y: -8, opacity: 0.7 }}
                        animate={{ clipPath: 'inset(0 0% 0 0)', y: 0, opacity: 1 }}
                        exit={{
                          clipPath: 'inset(0 0% 0 100%)',
                          y: -18,
                          skewX: -12,
                          opacity: 0,
                          transition: { duration: 0.27, ease: [0.55, 0, 0.9, 0.4] },
                        }}
                        transition={{ duration: 0.34, ease: 'easeOut', delay: 0.08 }}
                        style={{
                          position: 'absolute', top: -10,
                          left: 'calc(50% - 42px)',
                          width: 84, height: 22,
                          rotate: tapeRot,
                          background: 'rgba(200,176,120,.38)',
                          border: '1px solid rgba(180,150,90,.22)',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                      <BucketCard
                        item={item}
                        index={idx}
                        onToggle={() => handleToggle(item.id)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                        onClick={() => setOpenDetailId(item.id)}
                      />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{
              marginTop: 48, textAlign: 'center', padding: '72px 24px',
              background: '#fffdf6', border: '1px dashed #d9c9a8',
            }}>
              <span className="asp-hand" style={{ fontSize: 36, color: '#cabb9f' }}>—</span>
              <p style={{
                margin: '14px 0 6px',
                fontFamily: 'var(--font-nunito), sans-serif',
                fontWeight: 400, fontSize: 24, color: '#34283a',
              }}>
                {filter === 'all' ? 'A blank page…' : `No ${CATS[filter as Category]?.label.toLowerCase() ?? ''} entries yet`}
              </p>
              <p style={{ margin: '0 0 26px', fontSize: 15, color: '#a89c89' }}>
                Every great life starts with a list. Write your first entry.
              </p>
              <button
                onClick={openAdd}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px',
                  border: '1.5px solid #5b4694', borderRadius: 2,
                  background: '#5b4694', color: '#fbf6ea',
                  fontFamily: 'var(--font-nunito), sans-serif', fontSize: 15, cursor: 'pointer',
                }}
              >
                Write it in
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ── MODALS ────────────────────────────────────────────── */}
      {modalOpen && (
        <AddEditModal
          item={editingItem}
          defaultCategory={defaultCat}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setSaveError(null) }}
          error={saveError ?? undefined}
        />
      )}

      {openDetailItem && (
        <DetailPanel
          item={openDetailItem}
          onClose={() => setOpenDetailId(null)}
          onItemUpdate={handleItemUpdate}
          onEdit={() => {
            const it = openDetailItem
            setOpenDetailId(null)
            openEdit(it)
          }}
        />
      )}
    </>
  )
}
