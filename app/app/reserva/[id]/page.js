import Reserva from '@/components/Reserva'

export const metadata = { title: 'Tu reserva · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Reserva id={id} />
}
