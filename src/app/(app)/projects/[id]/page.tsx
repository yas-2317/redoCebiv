import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StackBadge } from '@/components/stack/StackBadge'
import { FeatureList } from '@/components/project/FeatureList'

const DIFFICULTY_STARS: Record<number, string> = { 1: '★☆☆', 2: '★★☆', 3: '★★★' }

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
        .select('id, name, description, related_file_paths, display_order, category, relevant_stacks')
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
              <StackBadge key={s} label={s} />
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
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">Progress</span>
        </div>
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
        <FeatureList
          projectId={id}
          usecases={(usecases ?? []).map(uc => ({
            ...uc,
            relevant_stacks: (uc.relevant_stacks as string[] | null) ?? [],
          }))}
          tracedIds={[...tracedIds]}
          projectStack={project.stack ?? []}
          totalUsecases={totalUsecases}
          tracedCount={tracedCount}
        />

        {/* Challenges */}
        <section style={{ minWidth: 0 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Challenges</span>
              <span className="card-header-meta">{solvedCount} / {totalChallenges} solved</span>
            </div>

            {totalChallenges === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                Challenges will appear once more features are traced.
              </div>
            ) : (
              <div style={{ overflow: 'hidden' }}>
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
          </div>
        </section>

      </div>
    </div>
  )
}
