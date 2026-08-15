import { PageHeader } from '../../components/layout/AppLayout'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card empty" style={{ marginTop: 'var(--space-6)' }}>
        <p>این بخش بهزودی اضافه میشود.</p>
      </div>
    </>
  )
}