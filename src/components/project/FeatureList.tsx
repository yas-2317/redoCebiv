'use client'

import { useState } from 'react'
import Link from 'next/link'

type Usecase = {
  id: string
  name: string
  description: string | null
  category: string
  related_file_paths: string[]
  relevant_stacks: string[]
  display_order: number
}

interface FeatureListProps {
  projectId: string
  usecases: Usecase[]
  tracedIds: string[]
  projectStack: string[]
  totalUsecases: number
  tracedCount: number
}

const CATEGORY_LABEL: Record<string, string> = {
  auth: 'Authentication',
  content: 'Content',
  navigation: 'Navigation',
  settings: 'Settings',
  social: 'Social',
  other: 'Other',
}
const CATEGORY_ORDER = ['auth', 'content', 'navigation', 'settings', 'social', 'other']

export function FeatureList({
  projectId, usecases, tracedIds, projectStack, totalUsecases, tracedCount,
}: FeatureListProps) {
  const [tab, setTab] = useState<'category' | 'stack'>('category')
  const tracedSet = new Set(tracedIds)

  const tabBtn = (t: 'category' | 'stack', label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      style={{
        padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
        ...(tab === t
          ? { background: 'rgba(255,255,255,0.9)', color: '#1d6187', border: 'none' }
          : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.3)' }
        ),
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  const usecaseRow = (uc: Usecase, index: number, showStackBadges = true) => {
    const isTraced = tracedSet.has(uc.id)
    return (
      <div
        key={uc.id}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: index > 0 ? '1px solid #f9fafb' : undefined,
          background: isTraced ? '#f0fdf4' : 'white',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '13px', color: isTraced ? '#16a34a' : '#d1d5db', flexShrink: 0, lineHeight: 1 }}>
            {isTraced ? '●' : '○'}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {uc.name}
            </p>
            {showStackBadges && uc.relevant_stacks.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                {uc.relevant_stacks.map(s => (
                  <span key={s} style={{
                    fontSize: '10px', fontWeight: 500, color: '#1d6187',
                    background: '#e2eef5', border: '1px solid #97bbd0',
                    borderRadius: '3px', padding: '0px 5px',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
            {uc.description && (
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {uc.description}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/projects/${projectId}/trace/${uc.id}`}
          style={{
            flexShrink: 0,
            padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
            textDecoration: 'none',
            ...(isTraced
              ? { color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0' }
              : { color: 'white', background: '#1d6187', border: '1px solid transparent' }
            ),
          }}
        >
          {isTraced ? 'View trace' : 'Trace back →'}
        </Link>
      </div>
    )
  }

  return (
    <section style={{ minWidth: 0 }}>
      {totalUsecases === 0 ? (
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>No features found.</p>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Features</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="card-header-meta">{tracedCount} / {totalUsecases} traced</span>
              {projectStack.length > 0 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {tabBtn('category', 'Category')}
                  {tabBtn('stack', 'Stack')}
                </div>
              )}
            </div>
          </div>

          {tab === 'category' ? (
            // カテゴリ別表示（既存ロジック）
            (() => {
              const byCategory: Record<string, Usecase[]> = {}
              for (const uc of usecases) {
                const cat = uc.category ?? 'other'
                byCategory[cat] = byCategory[cat] ?? []
                byCategory[cat].push(uc)
              }
              const activeCategories = CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)
              return activeCategories.map((cat, catIndex) => (
                <div key={cat}>
                  {catIndex > 0 && <div style={{ borderTop: '1px solid #f3f4f6' }} />}
                  <div style={{ padding: '8px 16px', background: '#f9fafb' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                      {CATEGORY_LABEL[cat] ?? cat}
                    </span>
                  </div>
                  {[...(byCategory[cat] ?? [])].sort((a, b) => (tracedSet.has(a.id) ? 1 : 0) - (tracedSet.has(b.id) ? 1 : 0)).map((uc, i) =>
                    usecaseRow(uc, i, true)
                  )}
                </div>
              ))
            })()
          ) : (
            // スタック別表示
            (() => {
              // project.stack の順序に従ってグループ化
              const byStack: Record<string, Usecase[]> = {}
              const unstacked: Usecase[] = []
              for (const uc of usecases) {
                if (uc.relevant_stacks.length === 0) {
                  unstacked.push(uc)
                } else {
                  // 最初のスタックでグループ化（primary stack）
                  const primary = uc.relevant_stacks[0]
                  byStack[primary] = byStack[primary] ?? []
                  byStack[primary].push(uc)
                }
              }
              const activeStacks = projectStack.filter(s => (byStack[s]?.length ?? 0) > 0)
              return (
                <>
                  {activeStacks.map((stack, stackIndex) => (
                    <div key={stack}>
                      {stackIndex > 0 && <div style={{ borderTop: '1px solid #f3f4f6' }} />}
                      <div style={{ padding: '8px 16px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, color: '#1d6187',
                          background: '#e2eef5', border: '1px solid #97bbd0',
                          borderRadius: '3px', padding: '1px 7px',
                        }}>
                          {stack}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {byStack[stack]?.length ?? 0} features
                        </span>
                      </div>
                      {(byStack[stack] ?? []).sort((a, b) => (tracedSet.has(a.id) ? 1 : 0) - (tracedSet.has(b.id) ? 1 : 0)).map((uc, i) =>
                        usecaseRow(uc, i, false)
                      )}
                    </div>
                  ))}
                  {unstacked.length > 0 && (
                    <div>
                      {activeStacks.length > 0 && <div style={{ borderTop: '1px solid #f3f4f6' }} />}
                      <div style={{ padding: '8px 16px', background: '#f9fafb' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>Other</span>
                      </div>
                      {unstacked.map((uc, i) => usecaseRow(uc, i, false))}
                    </div>
                  )}
                </>
              )
            })()
          )}

        </div>
      )}
    </section>
  )
}
