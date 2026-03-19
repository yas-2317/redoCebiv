import AnalyzingStatus from '@/components/project/AnalyzingStatus'

export default async function AnalyzingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '48px' }}>
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '40px 48px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '24px' }}>
          Analyzing your project
        </p>
        <AnalyzingStatus projectId={id} />
      </div>
    </div>
  )
}
