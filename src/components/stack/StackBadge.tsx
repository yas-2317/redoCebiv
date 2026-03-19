'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getStackByLabel } from '@/lib/stacks/reference'
import type { StackEntry } from '@/lib/stacks/reference'

export function StackBadge({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  const entry = getStackByLabel(label)

  return (
    <>
      <button
        onClick={() => entry && setOpen(true)}
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#1d6187',
          background: '#e2eef5',
          border: '1px solid #97bbd0',
          cursor: entry ? 'pointer' : 'default',
        }}
      >
        {label}
      </button>

      {open && entry && (
        <StackModal entry={entry} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

function StackModal({ entry, onClose }: { entry: StackEntry; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '16px',
          padding: '28px', maxWidth: '520px', width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{entry.label}</h2>
              <span style={{
                padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 500,
                background: '#e2eef5', color: '#1d6187', border: '1px solid #97bbd0',
              }}>
                {entry.role}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>{entry.description}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, width: '28px', height: '28px',
              borderRadius: '6px', border: '1px solid #e5e7eb',
              background: 'white', color: '#6b7280',
              fontSize: '16px', cursor: 'pointer', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Best for */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
            こんな時に向いている
          </p>
          <p style={{ fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>{entry.bestFor}</p>
        </div>

        {/* Alternatives */}
        {entry.alternatives.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              同じ役割の他のスタック
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entry.alternatives.map(alt => (
                <div key={alt.slug} style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>{alt.label}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>{alt.vs}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to full page */}
        <Link
          href={`/stacks/${entry.slug}`}
          onClick={onClose}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '13px', color: '#1d6187', fontWeight: 500,
            textDecoration: 'none', borderBottom: '1px solid #97bbd0',
            alignSelf: 'flex-start',
          }}
        >
          詳しく見る →
        </Link>
      </div>
    </div>
  )
}
