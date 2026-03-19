import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const DIFFICULTY_STARS: Record<number, string> = { 1: '★☆☆', 2: '★★☆', 3: '★★★' }

const CATEGORY_LABEL: Record<string, string> = {
  auth: 'Authentication',
  content: 'Content',
  navigation: 'Navigation',
  settings: 'Settings',
  social: 'Social',
  other: 'Other',
}

const CATEGORY_ORDER = ['auth', 'content', 'navigation', 'settings', 'social', 'other']

const GRADE_ICON: Record<string, string> = {
  self: '✅',
  with_hint: '🟡',
  missed: '❌',
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status, stack, file_count, created_at, zip_hash')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const [{ data: usecases }, { data: challenges }, { data: traces }, { data: submissions }] =
    await Promise.all([
      supabase
        .from('usecases')
        .select('id, name, description, related_file_paths, display_order, category')
        .eq('project_id', id)
        .order('display_order'),
      supabase
        .from('challenges')
        .select('id, title, type, difficulty')
        .eq('project_id', id)
        .eq('status', 'active')
        .order('difficulty'),
      supabase
        .from('traces')
        .select('usecase_id')
        .eq('project_zip_hash', project.zip_hash ?? ''),
      supabase
        .from('challenge_submissions')
        .select('challenge_id, grade')
        .eq('user_id', user!.id)
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
    ])

  const tracedIds = new Set((traces ?? []).map(t => t.usecase_id))

  const submissionByChallenge: Record<string, string> = {}
  for (const s of submissions ?? []) {
    if (!submissionByChallenge[s.challenge_id]) {
      submissionByChallenge[s.challenge_id] = s.grade
    }
  }

  const byCategory: Record<string, typeof usecases> = {}
  for (const uc of usecases ?? []) {
    const cat = uc.category ?? 'other'
    byCategory[cat] = byCategory[cat] ?? []
    byCategory[cat].push(uc)
  }
  const activeCategories = CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0)

  const totalUsecases = usecases?.length ?? 0
  const tracedCount = (usecases ?? []).filter(uc => tracedIds.has(uc.id)).length
  const tracePct = totalUsecases > 0 ? Math.round((tracedCount / totalUsecases) * 100) : 0

  const totalChallenges = challenges?.length ?? 0
  const solvedCount = Object.values(submissionByChallenge).filter(g => g !== 'missed').length
  const challengePct = totalChallenges > 0 ? Math.round((solvedCount / totalChallenges) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link href="/projects" style={{ color: '#6b7280', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <span style={{ color: '#111827' }}>{project.name}</span>
      </nav>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{project.name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {(project.stack ?? []).map((s: string) => (
              <span
                key={s}
                style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                  color: '#1d6187', background: '#e2eef5', border: '1px solid #97bbd0',
                }}
              >
                {s}
              </span>
            ))}
            {project.file_count != null && (
              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '4px' }}>
                {project.file_count} files
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/projects/${id}/change`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '9px',
            background: '#1d6187', color: 'white',
            fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', flexShrink: 0,
            boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
          }}
        >
          Find changes ▶
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Features traced', value: tracedCount, total: totalUsecases, pct: tracePct, color: '#1d6187' },
            { label: 'Challenges solved', value: solvedCount, total: totalChallenges, pct: challengePct, color: '#16a34a' },
          ].map(({ label, value, total, pct, color }, i) => (
            <div key={label} style={{ padding: '16px 24px', borderLeft: i > 0 ? '1px solid #f3f4f6' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{value} / {total}</span>
              </div>
              <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-column: Features (left) + Challenges (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', alignItems: 'start' }}>

        {/* Features */}
        <section style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '12px' }}>
            Features
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af', marginLeft: '8px' }}>
              {tracedCount} / {totalUsecases} traced
            </span>
          </p>

          {totalUsecases === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No features found.</p>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {activeCategories.map((cat, catIndex) => (
                <div key={cat}>
                  {catIndex > 0 && <div style={{ borderTop: '1px solid #f3f4f6' }} />}
                  <div style={{ padding: '8px 16px', background: '#f9fafb' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af' }}>
                      {CATEGORY_LABEL[cat] ?? cat}
                    </span>
                  </div>
                  {[...(byCategory[cat] ?? [])].sort((a, b) => (tracedIds.has(a.id) ? 1 : 0) - (tracedIds.has(b.id) ? 1 : 0)).map((uc, ucIndex) => {
                    const isTraced = tracedIds.has(uc.id)
                    return (
                      <div
                        key={uc.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderTop: ucIndex > 0 ? '1px solid #f9fafb' : undefined,
                          background: isTraced ? '#f0fdf4' : 'white',
                          transition: 'background 0.1s',
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
                            {uc.description && (
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {uc.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/projects/${id}/trace/${uc.id}`}
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
                          {isTraced ? 'View trace' : 'Run trace →'}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Challenges */}
        <section style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '12px' }}>
            Challenges
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af', marginLeft: '8px' }}>
              {solvedCount} / {totalChallenges} solved
            </span>
          </p>

          {totalChallenges === 0 ? (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              Challenges will appear once more features are traced.
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {[...(challenges ?? [])].sort((a, b) => {
                const aSolved = submissionByChallenge[a.id] && submissionByChallenge[a.id] !== 'missed'
                const bSolved = submissionByChallenge[b.id] && submissionByChallenge[b.id] !== 'missed'
                return (aSolved ? 1 : 0) - (bSolved ? 1 : 0)
              }).map((ch, i) => {
                const grade = submissionByChallenge[ch.id]
                const icon = grade ? GRADE_ICON[grade] : null
                const isSolved = grade && grade !== 'missed'
                return (
                  <div
                    key={ch.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderTop: i > 0 ? '1px solid #f9fafb' : undefined,
                      background: isSolved ? '#f0fdf4' : 'white',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0, width: '18px', textAlign: 'center' }}>
                        {icon ?? <span style={{ color: '#e5e7eb' }}>○</span>}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ch.title}
                        </p>
                        <p style={{ fontSize: '11px', color: '#d97706', marginTop: '1px' }}>
                          {DIFFICULTY_STARS[ch.difficulty] ?? '★☆☆'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/projects/${id}/challenge/${ch.id}`}
                      style={{
                        flexShrink: 0,
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                        textDecoration: 'none',
                        ...(isSolved
                          ? { color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0' }
                          : { color: 'white', background: '#1d6187', border: '1px solid transparent' }
                        ),
                      }}
                    >
                      {grade ? 'Retry' : 'Start'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
