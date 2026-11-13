import Torneo from '@/components/Torneo'

export const metadata = { title: 'Torneo · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Torneo id={id} />
}
