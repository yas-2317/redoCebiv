import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPlanInfo } from '@/lib/billing/config'
import { PageIntro, ProgressBarRow, SectionHeader, SurfaceCard, StateBadge } from '@/components/dashboard/primitives'

const ACTION_LABEL: Record<string, string> = {
  welcome_bonus: 'Welcome bonus',
  monthly_grant: 'Monthly charts',
  initial_analysis: 'Analysis',
  trace_generate: 'Trace',
  change_proposal: 'Change',
  challenge_grade: 'Challenge',
  manual_adjustment: 'Adjustment',
}

const ACTION_TONE: Record<string, 'brand' | 'success' | 'hint' | 'default'> = {
  welcome_bonus: 'success',
  monthly_grant: 'success',
  initial_analysis: 'hint',
  trace_generate: 'brand',
  change_proposal: 'brand',
  challenge_grade: 'brand',
  manual_adjustment: 'default',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: transactions }] = await Promise.all([
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
  const chartsLogged = (transactions ?? [])
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

  return (
    <div className="quiet-grid gap-8">
      <PageIntro
        eyebrow="Settings"
        title="A calmer account of identity, plan, and usage."
        description="The account page should stay quiet, but make billing and history easy to scan without feeling like an admin console."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <SurfaceCard>
            <SectionHeader title="Account" />
            <div className="grid gap-5">
              <Field label="Display name" value={profile?.display_name ?? '—'} />
              <Field label="Email" value={user.email ?? '—'} />
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader title="Plan & billing" />
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="quiet-meta">Current plan</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">{planInfo.label}</p>
                  <p className="quiet-body mt-2">Free plan for exploring and tracing small projects.</p>
                </div>
                <StateBadge label="Upgrade" tone="brand" />
              </div>

              <ProgressBarRow
                label="Charts remaining"
                helper="Analysis credits left"
                value={creditBalance}
                max={planInfo.displayMax}
                tone={creditBalance < planInfo.displayMax * 0.2 ? 'missed' : 'brand'}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Charts logged" helper="All time" value={chartsLogged} />
                <InfoCard label="Plan helper" helper="Clarifying the tier" value={planInfo.label === 'Wanderer' ? 'Free plan' : 'Paid plan'} />
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard>
          <SectionHeader title="Usage history" description="Type badges and spacing make the ledger much easier to scan." />
          <div className="space-y-3">
            {(transactions ?? []).length === 0 ? (
              <p className="quiet-meta">No transactions yet.</p>
            ) : (
              (transactions ?? []).map((transaction, index) => {
                const projectName = (transaction.projects as unknown as { name: string } | null)?.name
                const date = new Date(transaction.created_at)
                const amountPositive = transaction.amount > 0
                const tone = ACTION_TONE[transaction.action_type] ?? 'default'

                return (
                  <div
                    key={`${transaction.created_at}-${index}`}
                    className="flex flex-col gap-3 rounded-[18px] border border-[var(--app-border)] bg-white/78 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-12 shrink-0 text-xs text-[var(--app-subtle)]">
                        {date.getMonth() + 1}/{date.getDate()}
                      </span>
                      <StateBadge label={ACTION_LABEL[transaction.action_type] ?? transaction.action_type} tone={tone} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--app-text)]">
                          {projectName ?? 'Workspace activity'}
                        </p>
                        <p className="quiet-meta mt-1">{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${amountPositive ? 'text-[var(--app-success)]' : 'text-[var(--app-muted)]'}`}>
                      {amountPositive ? '+' : ''}
                      {transaction.amount}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="quiet-meta">{label}</p>
      <p className="mt-2 text-base font-medium text-[var(--app-text)]">{value}</p>
    </div>
  )
}

function InfoCard({
  label,
  helper,
  value,
}: {
  label: string
  helper: string
  value: string | number
}) {
  return (
    <div className="rounded-[18px] border border-[var(--app-border)] bg-white/76 p-4">
      <p className="quiet-meta">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">{value}</p>
      <p className="quiet-meta mt-2">{helper}</p>
    </div>
  )
}
