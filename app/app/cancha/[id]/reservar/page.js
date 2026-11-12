import Reservar from '@/components/Reservar'

export const metadata = { title: 'Reservá tu turno · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Reservar id={id} />
}
