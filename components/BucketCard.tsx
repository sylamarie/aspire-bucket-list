'use client'

import { BucketItem } from '@/types/bucket'
import { CATS, fmtDate } from '@/lib/cats'

interface Props {
  item: BucketItem
  index: number
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
}

export default function BucketCard({ item, index, onToggle, onEdit, onDelete, onClick }: Props) {
  const c = CATS[item.category] ?? CATS['travel']

  const stampStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 11px',
    border: `1.5px solid ${c.ink}`,
    borderRadius: 2,
    fontFamily: 'var(--font-nunito), sans-serif',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    background: c.tint,
    color: c.ink,
  }

  const subsDone = item.subtasks.filter(s => s.done).length
  const subTotal = item.subtasks.length
  const subPct = subTotal ? Math.round((subsDone / subTotal) * 100) : 0

  return (
    <div
      className="asp-card-vintage"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 22px 20px',
        background: item.done ? '#f6efe0' : '#fffdf6',
        border: '1px solid #e6d8bd',
        boxShadow: '2px 4px 14px rgba(58,30,61,.10)',
        cursor: 'pointer',
        opacity: item.done ? 0.78 : 1,
      }}
    >

      {/* Stamp + date */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={stampStyle}>{c.label}</span>
        <span
          className="asp-hand"
          style={{ fontSize: 18, color: '#a08766', whiteSpace: 'nowrap', marginTop: 2 }}
        >
          {item.done ? '✓ achieved' : fmtDate(item.target_date)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        margin: '15px 0 9px',
        fontFamily: "'Study Daily', var(--font-nunito), sans-serif",
        fontWeight: 400,
        fontSize: 22,
        lineHeight: 1.22,
        color: '#2f2535',
        textDecoration: item.done ? 'line-through' : 'none',
        textDecorationColor: '#bdaf99',
      }}>
        {item.title}
      </h3>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.55, color: '#6b6052', flex: 1 }}>
        {item.description || '—'}
      </p>

      {/* Subtask progress bar */}
      {subTotal > 0 && (
        <div style={{ marginTop: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <span className="asp-hand" style={{ fontSize: 17, color: '#8a7d6c' }}>
              {subsDone} of {subTotal} done
            </span>
            <span style={{ fontSize: 12, color: '#a89c89' }}>{subPct}%</span>
          </div>
          <div style={{ height: 6, border: '1px solid #ddcfb4', background: '#f3ead8', overflow: 'hidden', borderRadius: 1 }}>
            <div style={{
              height: '100%',
              width: `${subPct}%`,
              background: c.ink,
              transition: 'width .3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 18,
        paddingTop: 14,
        borderTop: '1px dashed #d7c8ab',
      }}>
        {item.gallery.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {/* Stacked photo thumbnails */}
            <div style={{ position: 'relative', width: 54, height: 52, flexShrink: 0 }}>
              {item.gallery.slice(0, 3).map((photo, i) => {
                const rots  = [-8, 4, -1]
                const dxPx  = [-4, 4, 0]
                const dyPx  = [5, 3, 0]
                return (
                  <img
                    key={photo.id}
                    src={photo.src}
                    alt=""
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${dxPx[i]}px - 18px)`,
                      top: dyPx[i],
                      width: 36,
                      height: 44,
                      objectFit: 'cover',
                      border: '2px solid #fff',
                      boxShadow: '1px 2px 6px rgba(0,0,0,.22)',
                      transform: `rotate(${rots[i]}deg)`,
                      zIndex: i,
                    }}
                  />
                )
              })}
            </div>
            <span style={{ fontSize: 13, color: '#9a8e7e' }}>
              {item.gallery.length} {item.gallery.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>
        ) : (
          <span className="asp-hand" style={{ fontSize: 16, color: '#b0a48f' }}>tap to journal…</span>
        )}

        <div style={{ display: 'flex', gap: 5 }}>
          {/* Toggle done */}
          <button
            title={item.done ? 'Mark undone' : 'Mark done'}
            onClick={e => { e.stopPropagation(); onToggle() }}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 2, cursor: 'pointer',
              border: `1px solid ${item.done ? c.ink : '#e0d2b6'}`,
              background: item.done ? c.ink : '#fbf6ea',
              color: item.done ? '#fbf6ea' : '#b6a98f',
              transition: 'all .15s ease',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>

          {/* Edit */}
          <button
            title="Edit"
            onClick={e => { e.stopPropagation(); onEdit() }}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, border: '1px solid #e0d2b6', borderRadius: 2,
              background: '#fbf6ea', color: '#8a7d6c', cursor: 'pointer',
              transition: 'all .15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>

          {/* Delete */}
          <button
            title="Delete"
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, border: '1px solid #e0d2b6', borderRadius: 2,
              background: '#fbf6ea', color: '#b6a98f', cursor: 'pointer',
              transition: 'all .15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
