import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserMenu from '@/components/ui/UserMenu'
import NavLinks from '@/components/ui/NavLinks'

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

  return (
    <div style={{ minHeight: '100vh', background: '#f3f8fb' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ opacity: 1, transition: 'opacity 0.15s' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wordmark.png" alt="redoCebiv" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <span style={{ fontSize: '12px', color: '#9ca3af', borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', letterSpacing: '0.01em' }}>
            Trace it. Take it back.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLinks />
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
