import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserMenu from '@/components/ui/UserMenu'
import NavLinks from '@/components/ui/NavLinks'
import { getPlanInfo } from '@/lib/billing/config'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, credit_balance, plan')
    .eq('id', user.id)
    .single()

  const creditBalance = profile?.credit_balance ?? 0
  const planInfo = getPlanInfo(profile?.plan ?? 'wanderer')
  const planMax = planInfo.displayMax
  const planLabel = planInfo.label
  const creditLow = creditBalance < planMax * 0.2

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ opacity: 1, transition: 'opacity 0.15s' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wordmark.png" alt="redoCebiv" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <span style={{ fontSize: '12px', color: '#9ca3af', borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', letterSpacing: '0.01em' }}>
            Trace back. Take back the helm.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLinks />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px', color: '#9ca3af',
              background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px',
            }}>
              {planLabel}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: 500,
              color: creditLow ? '#dc2626' : '#6b7280',
              background: creditLow ? '#fef2f2' : '#f3f4f6',
              padding: '3px 8px', borderRadius: '99px',
            }}>
              {creditBalance} charts remaining
            </span>
            <Link href="/settings" style={{
              fontSize: '11px', fontWeight: 500,
              color: '#1d6187', textDecoration: 'none',
              background: '#e2eef5', padding: '3px 8px', borderRadius: '99px',
              whiteSpace: 'nowrap',
            }}>
              Upgrade
            </Link>
          </div>
          <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 4px' }} />
          <UserMenu displayName={profile?.display_name ?? user.email ?? ''} />
        </div>
      </header>
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}
