import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserMenu from '@/components/ui/UserMenu'
import NavLinks from '@/components/ui/NavLinks'
import { getPlanInfo } from '@/lib/billing/config'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, credit_balance, plan')
    .eq('id', user.id)
    .single()

  const planInfo = getPlanInfo(profile?.plan ?? 'wanderer')
  const creditBalance = profile?.credit_balance ?? 0
  const creditLow = creditBalance < planInfo.displayMax * 0.2

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/wordmark.png" alt="redoCebiv" className="h-7 w-auto dark:invert" />
            </Link>
            <p className="hidden border-l border-[var(--app-border)] pl-4 text-sm text-[var(--app-muted)] md:block">
              Trace back. Take back the helm.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <NavLinks />

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="quiet-pill">{planInfo.label}</span>
              <span
                className={`quiet-pill ${creditLow ? 'bg-[var(--app-missed-soft)] text-[var(--app-missed)]' : ''}`}
              >
                <span className="font-semibold text-[var(--app-text)]">{creditBalance}</span>
                Analysis credits left
              </span>
              <Link
                href="/settings"
                className="rounded-full bg-[var(--app-brand-soft)] px-4 py-2 text-sm font-medium text-[var(--app-brand)] transition hover:bg-white"
              >
                Upgrade
              </Link>
              <UserMenu displayName={profile?.display_name ?? user.email ?? ''} />
            </div>
          </div>
        </div>
      </header>

      <main className="app-container">{children}</main>
    </div>
  )
}
