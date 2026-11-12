import Cancha from '@/components/Cancha'

export const metadata = { title: 'Cancha · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Cancha id={id} />
}
