import Acceso from '@/components/Acceso'

export const metadata = { title: 'Crear cuenta · Juntik' }

// juntik.com/app/registro — crear cuenta (destino del CTA de la página de ventas)
export default function Registro() {
  return <Acceso modo="registro" />
}
