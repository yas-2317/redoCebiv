import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanInfo } from '@/lib/billing/config'

const ACTION_LABEL: Record<string, string> = {
  welcome_bonus:    'Welcome bonus',
  monthly_grant:    'Monthly charts',
  initial_analysis: 'Analysis',
  trace_generate:   'Trace back',
  change_proposal:  'Change proposal',
  challenge_grade:  'Challenge',
  manual_adjustment:'Adjustment',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, credit_balance, plan')
      .eq('id', user.id)
      .single(),
    supabase
      .from('credit_transactions')
      .select('amount, action_type, created_at, projects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const creditBalance = profile?.credit_balance ?? 0
  const planInfo = getPlanInfo(profile?.plan ?? 'wanderer')
  const planMax = planInfo.displayMax
  const planLabel = planInfo.label
  const creditPct = Math.round((creditBalance / planMax) * 100)
  const chartsLogged = (transactions ?? [])
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const creditLow = creditBalance < planMax * 0.2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* 左列: Account + Plan & Billing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Account */}
          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Account</p>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Display name</p>
                <p style={{ fontSize: '14px', color: '#111827' }}>{profile?.display_name ?? '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Email</p>
                <p style={{ fontSize: '14px', color: '#111827' }}>{user.email}</p>
              </div>
            </div>
          </section>

          {/* Plan & Billing */}
          <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Plan &amp; Billing</p>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Current plan</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{planLabel}</p>
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af', padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  Upgrade coming soon
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>Charts remaining</p>
                    <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '1px 6px', borderRadius: '4px' }}>{planLabel}</span>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: creditLow ? '#dc2626' : '#111827' }}>
                    {creditBalance} <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af' }}>/ {planMax}</span>
                  </p>
                </div>
                <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${creditPct}%`,
                    background: creditLow ? '#ef4444' : '#1d6187',
                    borderRadius: '99px', transition: 'width 0.3s',
                  }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Charts logged (all time)</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{chartsLogged}</p>
              </div>
            </div>
          </section>

        </div>

        {/* 右列: Usage history */}
        <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Usage history</p>
          </div>
          <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
            {(transactions ?? []).length === 0 ? (
              <p style={{ padding: '20px', fontSize: '13px', color: '#9ca3af' }}>No transactions yet.</p>
            ) : (
              (transactions ?? []).map((t, i) => {
                const isCredit = t.amount > 0
                const projectName = (t.projects as unknown as { name: string } | null)?.name
                const date = new Date(t.created_at)
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 20px', gap: '12px',
                      borderTop: i > 0 ? '1px solid #f9fafb' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0, width: '32px' }}>{dateStr}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                          {ACTION_LABEL[t.action_type] ?? t.action_type}
                        </p>
                        {projectName && (
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {projectName}
                          </p>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '13px', fontWeight: 600, flexShrink: 0,
                      color: isCredit ? '#16a34a' : '#6b7280',
                    }}>
                      {isCredit ? '+' : ''}{t.amount}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
