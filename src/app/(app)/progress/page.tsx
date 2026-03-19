import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Search, FolderOpen } from 'lucide-react'
import { getPlanInfo } from '@/lib/billing/config'

const GRADE_ICON: Record<string, string> = {
  self: '✅',
  with_hint: '🟡',
  missed: '❌',
}

const ACTION_LABEL: Record<string, string> = {
  welcome_bonus: 'Welcome bonus',
  monthly_grant: 'Monthly grant',
  initial_analysis: 'Project analysis',
  trace_generate: 'Trace',
  change_proposal: 'Change proposal',
  challenge_grade: 'Challenge',
  manual_adjustment: 'Adjustment',
}


export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: submissions },
    { data: traces },
    { data: projects },
    { data: profile },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from('challenge_submissions')
      .select('id, grade, created_at, challenge_id, challenges(title, projects(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('traces')
      .select('id, created_at, usecase_id, usecases(name, project_id, projects(name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, status')
      .eq('user_id', user.id)
      .eq('status', 'ready'),
    supabase
      .from('profiles')
      .select('credit_balance, plan')
      .eq('id', user.id)
      .single(),
    supabase
      .from('credit_transactions')
      .select('id, amount, action_type, project_id, note, created_at, projects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const totalChallenges = submissions?.length ?? 0
  const gradeCount = { self: 0, with_hint: 0, missed: 0 }
  for (const s of submissions ?? []) {
    gradeCount[s.grade as keyof typeof gradeCount]++
  }

  const creditBalance = profile?.credit_balance ?? 0
  const planInfo = getPlanInfo(profile?.plan ?? 'wanderer')
  const planMax = planInfo.displayMax
  // used = grant - balance, but we only know balance; show balance as "remaining"
  const usedPct = Math.max(0, Math.min(100, Math.round(((planMax - creditBalance) / planMax) * 100)))

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
      createdAt: t.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827' }}>What&apos;s yours now</h1>

      {/* 2カラムレイアウト */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px', alignItems: 'start' }}>

        {/* 左カラム */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge results */}
          {totalChallenges > 0 && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1d6187', marginBottom: '16px' }}>
                Challenge results
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { icon: '✅', label: 'Got it back',     count: gradeCount.self,      color: '#16a34a', bg: '#f0fdf4' },
                  { icon: '🟡', label: 'Needed a nudge',  count: gradeCount.with_hint, color: '#d97706', bg: '#fffbeb' },
                  { icon: '❌', label: 'Not yet',         count: gradeCount.missed,    color: '#dc2626', bg: '#fef2f2' },
                ].map(({ icon, label, count, color, bg }) => (
                  <div key={label} style={{ borderRadius: '10px', padding: '14px 16px', background: bg, textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                    <p style={{ fontSize: '24px', fontWeight: 700, color, lineHeight: 1 }}>{count}</p>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Solve rate bar */}
              {totalChallenges > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Solved without hints</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                      {Math.round((gradeCount.self / totalChallenges) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round((gradeCount.self / totalChallenges) * 100)}%`,
                      background: '#16a34a',
                      borderRadius: '99px',
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent activity */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Recent activity</h2>
            {activities.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                No activity yet.{' '}
                <Link href="/" style={{ color: '#1d6187' }}>Upload a project to get started.</Link>
              </p>
            ) : (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
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
                        {a.projectName && (
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{a.projectName}</p>
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

        {/* 右カラム: Credits — Make.com style */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: '80px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1d6187', marginBottom: '14px' }}>
            Credits
          </p>

          {/* Balance + plan label */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{creditBalance}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>/ {planMax} cr</span>
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{planInfo.label} plan</p>
          </div>

          {/* Progress bar — Make.com style */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, Math.round((creditBalance / planMax) * 100)))}%`,
                background: creditBalance < planMax * 0.2 ? '#ef4444' : '#1d6187',
                borderRadius: '99px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px', textAlign: 'right' }}>
              {usedPct}% used
            </p>
          </div>

          {/* Transactions */}
          {transactions && transactions.length > 0 ? (
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              {transactions.map((tx, i) => {
                const isCredit = tx.amount > 0
                const projectName = (tx.projects as unknown as { name: string } | null)?.name
                return (
                  <div
                    key={tx.id}
                    style={{
                      padding: '9px 0',
                      borderBottom: i < transactions.length - 1 ? '1px solid #f9fafb' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '12px', color: '#374151', fontWeight: 500, flex: 1, marginRight: '8px' }}>
                        {tx.note ?? ACTION_LABEL[tx.action_type] ?? tx.action_type}
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: isCredit ? '#16a34a' : '#6b7280', flexShrink: 0 }}>
                        {isCredit ? '+' : ''}{tx.amount}
                      </p>
                    </div>
                    {projectName && (
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{projectName}</p>
                    )}
                    <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '1px' }}>{formatDate(tx.created_at)}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>No transactions yet.</p>
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
