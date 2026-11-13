import Grupo from '@/components/Grupo'

export const metadata = { title: 'Grupo · Juntik' }

export default async function Page({ params }) {
  const { id } = await params
  return <Grupo id={id} />
}
