import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Search, FolderOpen } from 'lucide-react'

const GRADE_ICON: Record<string, string> = {
  self: '✅',
  with_hint: '🟡',
  missed: '❌',
}


export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: submissions },
    { data: traces },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from('challenge_submissions')
      .select('id, grade, created_at, challenge_id, challenges(title, project_id, projects(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('traces')
      .select('id, generated_at, usecase_id, usecases(name, project_id, relevant_stacks, projects(name))')
      .order('generated_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, status, stack')
      .eq('user_id', user.id)
      .eq('status', 'ready'),
  ])

  const totalChallenges = submissions?.length ?? 0
  const gradeCount = { self: 0, with_hint: 0, missed: 0 }
  for (const s of submissions ?? []) {
    gradeCount[s.grade as keyof typeof gradeCount]++
  }

  // スタック別集計
  const projectIds = (projects ?? []).map(p => p.id)
  const projectStackMap: Record<string, string[]> = {}
  for (const p of projects ?? []) {
    projectStackMap[p.id] = (p as unknown as { stack: string[] }).stack ?? []
  }

  // usecases を取得してスタック別の総数を集計
  const [{ data: usecases }, { data: challenges }] = await Promise.all([
    projectIds.length > 0
      ? supabase.from('usecases').select('id, relevant_stacks, project_id').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? supabase.from('challenges').select('id, project_id').in('project_id', projectIds)
      : Promise.resolve({ data: [] }),
  ])

  type StackStat = { traces: number; total: number; gotBack: number; challengeTotal: number }
  const stackStats: Record<string, StackStat> = {}

  // 総数: usecases の relevant_stacks から集計（空はプロジェクト単位フォールバック）
  for (const uc of usecases ?? []) {
    const stacks = (uc.relevant_stacks as string[])?.length > 0
      ? (uc.relevant_stacks as string[])
      : (projectStackMap[uc.project_id] ?? [])
    for (const stack of stacks) {
      stackStats[stack] ??= { traces: 0, total: 0, gotBack: 0, challengeTotal: 0 }
      stackStats[stack].total++
    }
  }

  // トレース数: traces の relevant_stacks から集計
  for (const t of traces ?? []) {
    const uc = t.usecases as unknown as { project_id: string; relevant_stacks: string[] } | null
    if (!uc) continue
    const stacks = uc.relevant_stacks?.length > 0
      ? uc.relevant_stacks
      : (projectStackMap[uc.project_id] ?? [])
    for (const stack of stacks) {
      stackStats[stack] ??= { traces: 0, total: 0, gotBack: 0, challengeTotal: 0 }
      stackStats[stack].traces++
    }
  }

  // challengeTotal: challenges テーブルの総数をプロジェクト単位 → project.stack にアトリビュート
  for (const c of challenges ?? []) {
    const stacks = projectStackMap[c.project_id] ?? []
    for (const stack of stacks) {
      stackStats[stack] ??= { traces: 0, total: 0, gotBack: 0, challengeTotal: 0 }
      stackStats[stack].challengeTotal++
    }
  }

  // gotBack: grade='self' の submissions をプロジェクト単位 → project.stack にアトリビュート
  for (const s of submissions ?? []) {
    if (s.grade !== 'self') continue
    const projectId = (s.challenges as unknown as { project_id: string } | null)?.project_id
    if (!projectId) continue
    const stacks = projectStackMap[projectId] ?? []
    for (const stack of stacks) {
      stackStats[stack] ??= { traces: 0, total: 0, gotBack: 0, challengeTotal: 0 }
      stackStats[stack].gotBack++
    }
  }

  // project.stack の順序を保ちながら、totalが1件以上のスタックのみ表示
  const allStacks = [...new Set(Object.values(projectStackMap).flat())]
    .filter(s => (stackStats[s]?.total ?? 0) > 0)

  // per-project 集計
  type ProjectStat = { name: string; tracedCount: number; totalUsecases: number; gotBack: number; challengeTotal: number }
  const projectStats: ProjectStat[] = (projects ?? []).map(p => {
    const pUsecases = (usecases ?? []).filter(u => u.project_id === p.id)
    const pChallenges = (challenges ?? []).filter(c => c.project_id === p.id)
    const pSubmissions = (submissions ?? []).filter(s =>
      (s.challenges as unknown as { project_id: string } | null)?.project_id === p.id
    )
    const tracedUsecaseIds = new Set(
      (traces ?? [])
        .map(t => (t.usecases as unknown as { project_id: string } | null)?.project_id === p.id ? t.usecase_id : null)
        .filter(Boolean)
    )
    return {
      name: p.name,
      tracedCount: tracedUsecaseIds.size,
      totalUsecases: pUsecases.length,
      gotBack: pSubmissions.filter(s => s.grade === 'self').length,
      challengeTotal: pChallenges.length,
    }
  }).filter(ps => ps.totalUsecases > 0)


  type ActivityItem = {
    icon: string; label: string; projectName: string; createdAt: string
  }

  const activities: ActivityItem[] = [
    ...(submissions ?? []).map(s => ({
      icon: GRADE_ICON[s.grade] ?? '❓',
      label: (s.challenges as unknown as { title: string } | null)?.title ?? 'Challenge',
      projectName: ((s.challenges as unknown as { projects: { name: string } | null } | null)?.projects)?.name ?? '',
      createdAt: s.created_at,
    })),
    ...(traces ?? []).map(t => ({
      icon: '🔍',
      label: (t.usecases as unknown as { name: string } | null)?.name ?? 'Trace',
      projectName: ((t.usecases as unknown as { projects: { name: string } | null } | null)?.projects)?.name ?? '',
      createdAt: t.generated_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>What&apos;s yours now</h1>

      {/* Stats */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { Icon: Trophy,     label: 'Challenges', value: totalChallenges },
            { Icon: Search,     label: 'Traces',     value: traces?.length ?? 0 },
            { Icon: FolderOpen, label: 'Projects',   value: projects?.length ?? 0 },
          ].map(({ Icon, label, value }, i) => (
            <div key={label} style={{ padding: '20px 24px', borderLeft: i > 0 ? '1px solid #f3f4f6' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Icon size={14} color="#9ca3af" />
                <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
              </div>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2列: Challenge results | Stack progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Challenge results */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="card-header">
            <span className="card-header-title">Challenge results</span>
          </div>
          <div style={{ padding: '20px' }}>
            {totalChallenges === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No challenges yet.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { icon: '✅', label: 'Got it back',    count: gradeCount.self,      color: '#16a34a', bg: '#f0fdf4' },
                    { icon: '🟡', label: 'Needed a nudge', count: gradeCount.with_hint, color: '#d97706', bg: '#fffbeb' },
                    { icon: '❌', label: 'Not yet',        count: gradeCount.missed,    color: '#dc2626', bg: '#fef2f2' },
                  ].map(({ icon, label, count, color, bg }) => (
                    <div key={label} style={{ borderRadius: '10px', padding: '14px 16px', background: bg, textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                      <p style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1 }}>{count}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Solved without hints</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                      {Math.round((gradeCount.self / totalChallenges) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((gradeCount.self / totalChallenges) * 100)}%`, background: '#16a34a', borderRadius: '99px' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stack progress */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="card-header">
            <span className="card-header-title">Stacks</span>
          </div>
          <div style={{ padding: '20px' }}>
            {allStacks.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No stack data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allStacks.map(stack => {
                  const stat = stackStats[stack]
                  const tracePct = stat.total > 0 ? Math.round((stat.traces / stat.total) * 100) : 0
                  const gotBackPct = stat.challengeTotal > 0 ? Math.round((stat.gotBack / stat.challengeTotal) * 100) : 0
                  return (
                    <div key={stack}>
                      <span style={{
                        fontSize: '12px', fontWeight: 500, color: '#1d6187',
                        background: '#e2eef5', border: '1px solid #97bbd0',
                        borderRadius: '4px', padding: '1px 7px', display: 'inline-block', marginBottom: '8px',
                      }}>
                        {stack}
                      </span>
                      {/* Traced bar */}
                      <div style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Traced</span>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>{stat.traces} / {stat.total}</span>
                        </div>
                        <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${tracePct}%`, background: '#1d6187', borderRadius: '99px' }} />
                        </div>
                      </div>
                      {/* Got back bar */}
                      {stat.challengeTotal > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontSize: '10px', color: '#6b7280' }}>Got back</span>
                            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{stat.gotBack} / {stat.challengeTotal}</span>
                          </div>
                          <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${gotBackPct}%`, background: '#16a34a', borderRadius: '99px' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Per-project breakdown */}
      {projectStats.length > 0 && (
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>By project</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {projectStats.map(ps => {
              const tracePct = ps.totalUsecases > 0 ? Math.round((ps.tracedCount / ps.totalUsecases) * 100) : 0
              const gotBackPct = ps.challengeTotal > 0 ? Math.round((ps.gotBack / ps.challengeTotal) * 100) : 0
              return (
                <div key={ps.name} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div className="card-header" style={{ padding: '10px 16px' }}>
                    <span className="card-header-title">{ps.name}</span>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Traced */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>Traced</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{ps.tracedCount} / {ps.totalUsecases} features</span>
                        </div>
                        <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${tracePct}%`, background: '#1d6187', borderRadius: '99px' }} />
                        </div>
                      </div>
                      {/* Got back */}
                      {ps.challengeTotal > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>Got back</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{ps.gotBack} / {ps.challengeTotal} challenges</span>
                          </div>
                          <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${gotBackPct}%`, background: '#16a34a', borderRadius: '99px' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {/* 3の倍数に満たない分のプレースホルダー */}
            {Array.from({ length: (3 - (projectStats.length % 3)) % 3 }).map((_, i) => (
              <div key={`placeholder-${i}`} style={{
                border: '1px dashed #d1d5db', borderRadius: '12px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px',
              }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Waiting for new vibes</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">Recent activity</span>
        </div>
        <div className="card-body">
          {activities.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              No activity yet.{' '}
              <Link href="/" style={{ color: '#1d6187' }}>Upload a project to get started.</Link>
            </p>
          ) : (
            <div>
              {activities.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderTop: i > 0 ? '1px solid #f9fafb' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>{a.icon}</span>
                    <div>
                      <p style={{ fontSize: '13px', color: '#1f2937', fontWeight: 500 }}>{a.label}</p>
                      {a.projectName && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{a.projectName}</p>}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
                    {formatRelative(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

