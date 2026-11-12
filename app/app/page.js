import Acceso from '@/components/Acceso'

export const metadata = { title: 'Iniciar sesión · Juntik' }

// juntik.com/app — login
export default function Login() {
  return <Acceso modo="login" />
}
