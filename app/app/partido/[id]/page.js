import Partido from '@/components/Partido'

export const metadata = { title: 'Partido · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Partido id={id} />
}
