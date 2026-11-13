import Jugador from '@/components/Jugador'

export const metadata = { title: 'Jugador · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Jugador id={id} />
}
