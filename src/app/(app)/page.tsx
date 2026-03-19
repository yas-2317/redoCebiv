import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FolderOpen, Layers, Search, Zap, Trophy } from 'lucide-react'
import ProjectCard from '@/components/project/ProjectCard'
import { enrichProjectsWithProgress } from './projects/page'
import { getPlanInfo } from '@/lib/billing/config'

const GRADE_ICON: Record<string, string> = {
  self: '✅',
  with_hint: '🟡',
  missed: '❌',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: allProjects },
    { data: submissions },
    { data: traces },
  ] = await Promise.all([
    supabase.from('profiles').select('credit_balance, plan').eq('id', user!.id).single(),
    supabase
      .from('projects')
      .select('id, name, status, stack, file_count, created_at')
      .eq('user_id', user!.id)
      .order('last_activity_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('challenge_submissions')
      .select('id, grade, created_at, challenges(title, projects(name, id))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(60),
    supabase
      .from('traces')
      .select('id, created_at, usecase_id, usecases(name, project_id, projects(name, id))')
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  const projects = allProjects ?? []
  const recentProjects = projects.slice(0, 3)
  const recentProjectsWithProgress = await enrichProjectsWithProgress(supabase, user!.id, recentProjects)

  const readyProjects = projects.filter(p => p.status === 'ready')
  const allWithProgress = await enrichProjectsWithProgress(supabase, user!.id, readyProjects)
  const totalFeatures = allWithProgress.reduce((s, p) => s + (p.usecaseCount ?? 0), 0)
  const totalTraces = allWithProgress.reduce((s, p) => s + (p.traceCount ?? 0), 0)
  const totalProjects = readyProjects.length
  const totalChallenges = submissions?.length ?? 0
  const creditBalance = profile?.credit_balance ?? 0
  const planInfo = getPlanInfo(profile?.plan ?? 'wanderer')
  const planMax = planInfo.displayMax
  const planLabel = planInfo.label
  const creditPct = Math.max(0, Math.min(100, Math.round((creditBalance / planMax) * 100)))

  // Grade counts
  const gradeCount = { self: 0, with_hint: 0, missed: 0 }
  for (const s of submissions ?? []) {
    gradeCount[s.grade as keyof typeof gradeCount]++
  }
  const solvePct = totalChallenges > 0 ? Math.round((gradeCount.self / totalChallenges) * 100) : 0

  // 過去7日間アクティビティ集計
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })
  const chartData = chartDays.map(day => {
    const next = new Date(day); next.setDate(next.getDate() + 1)
    const t = (traces ?? []).filter(x => { const d = new Date(x.created_at); return d >= day && d < next }).length
    const c = (submissions ?? []).filter(x => { const d = new Date(x.created_at); return d >= day && d < next }).length
    return { day, traces: t, challenges: c, total: t + c }
  })
  const chartMax = Math.max(...chartData.map(d => d.total), 1)

  // 週間・月間統計
  const now = new Date()
  const msDay = 86_400_000
  const thisWeekTotal = chartData.reduce((s, d) => s + d.total, 0)
  const lastWeekTotal = (() => {
    const start = new Date(now.getTime() - 14 * msDay)
    const end   = new Date(now.getTime() -  7 * msDay)
    const t = (traces ?? []).filter(x => { const d = new Date(x.created_at); return d >= start && d < end }).length
    const c = (submissions ?? []).filter(x => { const d = new Date(x.created_at); return d >= start && d < end }).length
    return t + c
  })()
  const monthlyTotal = (() => {
    const start = new Date(now.getTime() - 30 * msDay)
    const t = (traces ?? []).filter(x => new Date(x.created_at) >= start).length
    const c = (submissions ?? []).filter(x => new Date(x.created_at) >= start).length
    return t + c
  })()
  const weekDiff = thisWeekTotal - lastWeekTotal
  const weekDiffPct = lastWeekTotal > 0 ? Math.round(Math.abs(weekDiff) / lastWeekTotal * 100) : null

  type ActivityItem = { icon: string; label: string; projectName: string; createdAt: string }

  const activities: ActivityItem[] = [
    ...(submissions ?? []).map(s => ({
      icon: GRADE_ICON[s.grade] ?? '❓',
      label: (s.challenges as unknown as { title: string } | null)?.title ?? 'Challenge',
      projectName: ((s.challenges as unknown as { projects: { name: string; id: string } | null } | null)?.projects)?.name ?? '',
      createdAt: s.created_at,
    })),
    ...(traces ?? []).map(t => ({
      icon: '🔍',
      label: (t.usecases as unknown as { name: string } | null)?.name ?? 'Trace',
      projectName: ((t.usecases as unknown as { projects: { name: string; id: string } | null } | null)?.projects)?.name ?? '',
      createdAt: t.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  if (projects.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ height: '56px', width: 'auto', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
          You sparked it. Now let&apos;s trace it back to you.
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', maxWidth: '400px', lineHeight: '1.6', marginBottom: '28px' }}>
          Upload what you built. We&apos;ll work backwards until it&apos;s truly yours.
        </p>
        <Link
          href="/projects/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '8px',
            background: '#1d6187', color: 'white',
            fontSize: '14px', fontWeight: 500, textDecoration: 'none',
          }}
        >
          + New project
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* 上段 3列: Stats | Activity chart | What you've got back */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '16px', alignItems: 'stretch' }}>

        {/* Stats 2×3 grid */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
            {[
              { Icon: FolderOpen, label: 'Projects',   value: totalProjects,   i: 0 },
              { Icon: Layers,     label: 'Features',   value: totalFeatures,   i: 1 },
              { Icon: Search,     label: 'Traces',     value: totalTraces,     i: 2 },
              { Icon: Trophy,     label: 'Challenges', value: totalChallenges, i: 3 },
            ].map(({ Icon, label, value, i }) => (
              <div
                key={label}
                style={{
                  padding: '16px 18px',
                  borderTop: i >= 2 ? '1px solid #f3f4f6' : undefined,
                  borderLeft: i % 2 === 1 ? '1px solid #f3f4f6' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <Icon size={13} color="#9ca3af" />
                  <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
                </div>
                <p style={{ fontSize: '26px', fontWeight: 700, color: '#111827', lineHeight: 1, textAlign: 'right' }}>
                  {value}
                </p>
              </div>
            ))}

            {/* Credits — フル幅、バー + plan */}
            <div style={{ gridColumn: '1 / -1', padding: '14px 18px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={13} color="#1d6187" />
                  <span style={{ fontSize: '13px', color: '#374151' }}>Credits left</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, color: '#1d6187',
                    background: '#e2eef5', border: '1px solid #97bbd0',
                    borderRadius: '4px', padding: '1px 5px', marginLeft: '4px',
                  }}>
                    {planLabel}
                  </span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#1d6187', lineHeight: 1 }}>
                  {creditBalance}
                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af', marginLeft: '3px' }}>/ {planMax} cr</span>
                </span>
              </div>
              <div style={{ height: '5px', background: '#97bbd0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${creditPct}%`,
                  background: creditBalance < planMax * 0.2 ? '#ef4444' : '#1d6187',
                  borderRadius: '99px',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Activity chart */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '14px' }}>Activity</p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[
              {
                label: 'This week',
                value: thisWeekTotal,
                sub: null,
              },
              {
                label: 'vs last week',
                value: weekDiff === 0 ? '—' : `${weekDiff > 0 ? '+' : ''}${weekDiff}`,
                sub: weekDiffPct != null ? `${weekDiff >= 0 ? '↑' : '↓'}${weekDiffPct}%` : null,
                color: weekDiff > 0 ? '#16a34a' : weekDiff < 0 ? '#dc2626' : '#9ca3af',
              },
              {
                label: 'Monthly',
                value: monthlyTotal,
                sub: null,
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: color ?? '#111827', lineHeight: 1 }}>{value}</p>
                {sub && <p style={{ fontSize: '10px', color: color, marginTop: '2px' }}>{sub}</p>}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#1d6187' }} />
                Traces
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#a5b4fc' }} />
                Challenges
              </span>
            </div>
            <ActivityChart data={chartData} max={chartMax} />
          </div>
        </div>

        {/* What you've got back */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '14px' }}>
            What you&apos;ve got back
          </p>
          {totalChallenges === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                No challenges yet.<br />
                Start tracing a project<br />to unlock them.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {[
                  { icon: '✅', label: 'Got it back',    count: gradeCount.self,      color: '#16a34a', bg: '#f0fdf4' },
                  { icon: '🟡', label: 'Needed a nudge', count: gradeCount.with_hint, color: '#d97706', bg: '#fffbeb' },
                  { icon: '❌', label: 'Not yet',        count: gradeCount.missed,    color: '#dc2626', bg: '#fef2f2' },
                ].map(({ icon, label, count, color, bg }) => (
                  <div key={label} style={{ borderRadius: '8px', padding: '10px 12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
                      <span style={{ fontSize: '12px', color: '#374151' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 700, color, lineHeight: 1 }}>{count}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Solved without hints</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{solvePct}%</span>
                </div>
                <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${solvePct}%`, background: '#16a34a', borderRadius: '99px' }} />
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* 下段: プロジェクト(60%) + アクティビティ(40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', alignItems: 'start' }}>

        {/* プロジェクト 3カラムグリッド */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Your projects</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {projects.length > 3 && (
                <Link href="/projects" style={{ fontSize: '12px', color: '#1d6187', textDecoration: 'none', fontWeight: 500 }}>
                  All projects ({projects.length}) →
                </Link>
              )}
              <Link
                href="/projects/new"
                style={{
                  padding: '5px 12px', borderRadius: '7px',
                  background: '#1d6187', color: 'white',
                  fontSize: '12px', fontWeight: 500, textDecoration: 'none',
                }}
              >
                + New
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'stretch' }}>
            {recentProjectsWithProgress.map(p => (
              <ProjectCard
                key={p.id}
                id={p.id}
                name={p.name}
                status={p.status}
                stack={p.stack ?? []}
                fileCount={p.file_count}
                createdAt={p.created_at}
                traceCount={p.traceCount}
                usecaseCount={p.usecaseCount}
                solvedCount={p.solvedCount}
                challengeCount={p.challengeCount}
              />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', marginBottom: '14px' }}>Recent activity</h2>
          {activities.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No activity yet.</p>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {activities.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: i > 0 ? '1px solid #f9fafb' : undefined,
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{a.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: '#1f2937', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</p>
                      {a.projectName && (
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{a.projectName}</p>
                      )}
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

function ActivityChart({ data, max }: {
  data: { day: Date; traces: number; challenges: number; total: number }[]
  max: number
}) {
  const W = 560
  const H = 96
  const barW = 32
  const gap = (W - barW * 7) / 8
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map(r => (
        <line key={r} x1={0} y1={H * (1 - r)} x2={W} y2={H * (1 - r)} stroke="#f3f4f6" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const x = gap + i * (barW + gap)
        const traceH = max > 0 ? (d.traces / max) * H : 0
        const chalH = max > 0 ? (d.challenges / max) * H : 0
        const label = DAY_LABELS[d.day.getDay()]
        const isToday = i === 6
        return (
          <g key={i}>
            {traceH > 0 && (
              <rect x={x} y={H - traceH - chalH} width={barW} height={traceH} rx={4} ry={4} fill="#1d6187" opacity={isToday ? 1 : 0.7} />
            )}
            {chalH > 0 && (
              <rect x={x} y={H - chalH} width={barW} height={chalH} rx={4} ry={4} fill="#a5b4fc" opacity={isToday ? 1 : 0.7} />
            )}
            {d.total === 0 && (
              <rect x={x} y={H - 3} width={barW} height={3} rx={2} ry={2} fill="#f3f4f6" />
            )}
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={10} fill={isToday ? '#1d6187' : '#9ca3af'} fontWeight={isToday ? 600 : 400}>
              {label}
            </text>
            {d.total > 0 && (
              <text x={x + barW / 2} y={H - (traceH + chalH) - 5} textAnchor="middle" fontSize={10} fill="#6b7280">
                {d.total}
              </text>
            )}
          </g>
        )
      })}
    </svg>
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
