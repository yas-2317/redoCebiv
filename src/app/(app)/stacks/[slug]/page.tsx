import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStackEntry, STACK_REFERENCE } from '@/lib/stacks/reference'

export function generateStaticParams() {
  return STACK_REFERENCE.map(s => ({ slug: s.slug }))
}

export default async function StackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getStackEntry(slug)
  if (!entry) notFound()

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link href="/projects" style={{ color: '#6b7280', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <span style={{ color: '#111827' }}>{entry.label}</span>
      </nav>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{entry.label}</h1>
          <span style={{
            padding: '3px 10px', borderRadius: '99px',
            fontSize: '12px', fontWeight: 500,
            background: '#e2eef5', color: '#1d6187', border: '1px solid #97bbd0',
          }}>
            {entry.role}
          </span>
        </div>
        <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.7' }}>{entry.description}</p>
      </div>

      {/* Best for */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px 24px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          こんな時に向いている
        </p>
        <p style={{ fontSize: '15px', color: '#166534', lineHeight: '1.7' }}>{entry.bestFor}</p>
      </div>

      {/* Alternatives */}
      {entry.alternatives.length > 0 && (
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
            同じ役割の他のスタック
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entry.alternatives.map(alt => (
              <div key={alt.slug} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Link
                    href={`/stacks/${alt.slug}`}
                    style={{
                      fontSize: '14px', fontWeight: 600, color: '#1d6187',
                      textDecoration: 'none', borderBottom: '1px solid #97bbd0',
                    }}
                  >
                    {alt.label}
                  </Link>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>との違い</span>
                </div>
                <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>{alt.vs}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
